load("lib.js")
load("ometa-base.js")
load("parser.js")
load("bs-js-compiler.js")
load("bs-ometa-compiler.js")
load("bs-ometa-optimizer.js")
load("bs-ometa-js-compiler.js")

alert = print

translateCode = function(s) {
  var translationError = function(m, i) { alert("Translation error - please tell Alex about this!"); throw fail },
      tree             = BSOMetaJSParser.matchAll(s, "topLevel", undefined, function(m, i) {
                                                                              throw objectThatDelegatesTo(fail, {errorPos: i}) })
  return BSOMetaJSTranslator.match(tree, "trans", undefined, translationError)
}

ometa = function(s) { return eval(translateCode(s)) }

