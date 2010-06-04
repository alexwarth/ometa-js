/*
  Copyright (c) 2008, 2010 Alessandro Warth <awarth@cs.ucla.edu>

  Limitations:
    * assignments into the properties of "arguments" (e.g., arguments[5] = 1234) don't modify their respective variables 
    * for-in doesn't work when the loop variable is a property access (e.g., for (x.y in ys) ...)
*/

Array.prototype.each = function(f) {
  for (var idx = 0; idx < this.length; idx++)
    f(this[idx], idx)
}

ometa WJSParser <: BSJSParser {
  isKeyword :x = ?(x == 'thisWorld')
               | super('isKeyword', x),
  primExprHd   = "thisWorld"            -> ['thisWorld']
               | super('primExprHd'),
  stmt         = "in" expr:w block:b    -> ['in', w, b]
               | super('stmt')
}

makeFunction = function(fs, body) {
  return '(function() { var staticScope = thisScope;'                                                            +
                      ' var r = function() {'                                                                    +
                        ' var oldScope = thisScope;'                                                             +
                        ' thisScope = staticScope.makeChild();'                                                  +
                        ' thisScope.set("arguments", arguments);'                                                +
                        ' thisWorld.set(arguments, "length", arguments.length);'                                 +
                        ' for (var i = 0; i < arguments.length; i++) thisWorld.set(arguments, i, arguments[i]);' +
                        ' try { ' + fs + body + '}'                                                              +
                        ' finally { thisScope = oldScope }};'                                                    +
                      ' baseWorld.set(r, "prototype", {parent: Object.prototype});'                              +
                      ' return r })()' }

makeIn = function(w, body) {
  return '{ try { worldStack.push(thisWorld); thisWorld = ' + w + '; ' + body + '} ' +
           'finally { thisWorld = worldStack.pop() }'                                +
           'undefined }'
}

makeForIn = function(v, e, s, decl) {
  var p = tempnam(), ps = tempnam()
  var r = 'for (var ' + p + ' in ' + ps + ' = thisWorld.props(' + e + ', {})) {' +
            'if (!' + ps + '.hasOwnProperty(' + p + ')) continue; ' +
            'thisScope.set("' + v + '", ' + p + '); ' + s +
          '}'
  if (decl)
    r = 'thisScope.decl("' + v + '", undefined); ' + r
  r = '{ var ' + ps + ' = undefined; ' + r + '}'
  return r
}

ometa WJSTranslator <: BSJSTranslator {
  initialize = { self.level = 0 },
  fargs = [anything*:fs]                            -> { var ss = []
                                                         fs.each(function(v, i) { ss.push('thisScope.decl("' + v +
                                                                                          '", arguments[' + i + ']);') })
                                                         ss.join('') },
  thisWorld                                         -> 'thisWorld',
  var  :n trans:v                                   -> ('thisScope.decl("' + n + '", ' + v + ')'),
  get  :n                                           -> ('thisScope.get("' + n + '")'),
  getp trans:p ['get' 'arguments']                  -> ('arguments[' + p + ']'),
  getp trans:p trans:x                              -> ('thisWorld.get(' + x + ', ' + p + ')'),
  set  ['get' :n]                           trans:v -> ('thisScope.set("' + n + '", ' + v + ')'),
  set  ['getp' trans:p ['get' 'arguments']] trans:v -> 'UNSUPPORTED OPERATION',
  set  ['getp' trans:p trans:x]             trans:v -> ('thisWorld.set(' + x + ', ' + p + ', ' + v + ')'),
  mset ['get' :n]               :op trans:rhs       -> ('thisScope.set("' + n + '", thisScope.get("' + n + '")' + op + rhs + ')'),
  mset ['getp' trans:p trans:x] :op trans:rhs       -> ('(function(r, p) { return thisWorld.set(r, p, thisWorld.get(r, p) ' +
                                                           op + ' ' + rhs + ') })(' + x + ', ' + p + ')'),
  preop  :op ['get' :n]                             -> ('thisScope.set("' + n + '", thisScope.get("' + n + '")' + op[0] + '1)'),
  preop  :op ['getp' trans:p trans:x]               -> ('(function(r, p) { return thisWorld.set(r, p, thisWorld.get(r, p) ' +
                                                           op[0] + ' 1) })(' + x + ', ' + p + ')'),
  postop :op ['get' :n]                             -> ('(function(n) { var ans = thisScope.get(n); ' +
                                                                       'thisScope.set(n, ans ' + op[0] + ' 1); ' +
                                                                       'return ans })("' + n + '")'),
  postop :op ['getp' trans:p trans:x]               -> ('(function(r, p) { var ans = thisWorld.get(r, p); ' +
                                                                          'thisWorld.set(r, p, ans ' + op[0] + ' 1); ' +
                                                                          'return ans })(' + x + ', ' + p + ')'),
  binop 'instanceof' trans:x trans:y                -> ('instanceOf(' + x + ', ' + y + ')'),
  binop :op          trans:x trans:y                -> ('(' + x + ' ' + op + ' ' + y + ')'),
  call trans:f trans*:as                            -> ('(' + f + ')(' + as.join(',') + ')'),
  send :m trans:r trans*:as                         -> ('send("' + m + '", ' + r + ', [' + as.join(',') + '])'),
  new :x trans*:as                                  -> ('thisScope.get("' + x + '").worldsNew(' + as.join(',') + ')'),
  func fargs:fs {self.level++} trans:body
                {self.level--}                      -> makeFunction(fs, body),
  in trans:w trans:b                                -> makeIn(w, b),
  arr  trans*:xs                                    -> ('[' + xs.join(',') + '].toWJSArray()'),
  json trans*:xs                                    -> ('({' + xs.join(',') + '}).toWJSObject()'),
  try curlyTrans:x :name curlyTrans:c curlyTrans:f  -> { var e = tempnam()
                                                         'try ' + x +
                                                         'catch(' + e + ') {thisScope.decl("' + name + '", ' + e + '); ' + c + '}' +
                                                         'finally' + f },
  forIn ['get' :v      ] trans:e trans:s            -> makeForIn(v, e, s, false),
  forIn ['var' :v :init] trans:e trans:s            -> makeForIn(v, e, s, true)
}

compileWJS = function(code) {
  var tree = WJSParser.matchAll(code, "topLevel", undefined, function(m, i) { throw fail.delegated({errorPos: i}) })
  //print("parsed: " + tree)
  var code = WJSTranslator.match(tree, 'trans')
  //print("compiled: " + code)
  return code
}

thisScope.decl("eval", function(s) { return eval(compileWJS(s)) })

oldPrint = print
print = function(x) { oldPrint(x == undefined || x == null ? x : send("toString", x)) }

translateCode = compileWJS

