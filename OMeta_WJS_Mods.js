OMeta._or = function() {
  for (var idx = 0; idx < arguments.length; idx++) {
    var ok = true
    in thisWorld.sprout() {
      try { return arguments[idx]() }
      catch (f) {
        ok = false
        if (f != fail)
          throw f
      }
      finally { if (ok) thisWorld.commit() }
    }
  }
  throw fail
}

OMeta._many = function(x) {
  var ans = arguments[1] != undefined ? [arguments[1]] : []
  while (true) {
    in thisWorld.sprout() {
      try {
        ans.push(x())
        //print("committing " + ans.toString())
        thisWorld.commit()
      }
      catch (f) {
        if (f != fail)
          throw f
        break
      }
    }
  }
  return ans
}

OMeta._not = function(x) {
  in thisWorld.sprout() {
    try { x() }
    catch (f) {
      if (f != fail)
        throw f
      return true
    }
  }
  throw fail
}

/*
OMeta._lookahead = function(x) {
  in thisWorld.sprout() {
    var r = x()
    //print("la = " + r.toString())
    return x
  }
}
*/

/*
OMeta._apply = function(rule) {
  var memoRec = this.input.memo[rule]
  if (memoRec == undefined) {
    var origInput = this.input,
        failer    = new Failer()
    this.input.memo[rule] = failer
    this.input.memo[rule] = memoRec = {ans: this[rule].apply(this), nextInput: this.input}
    if (failer.used) {
      var sentinel = this.input
      while (true) {
        try {
          this.input = origInput
          var ans = this[rule].apply(this)
          if (this.input == sentinel)
            throw fail
          memoRec.ans       = ans
          memoRec.nextInput = this.input
        }
        catch (f) {
          if (f != fail)
            throw f
          break
        }
      }
    }
  }
  else if (memoRec instanceof Failer) {
    memoRec.used = true
    throw fail
  }
  this.input = memoRec.nextInput
  return memoRec.ans
}
*/


print("defining example 1")
eval(BSOMetaJSTranslator.match(BSOMetaJSParser.matchAll("ometa M { ones = (1 -> 2)* }", "srcElem"), "trans"))
print("running example 1")
print(M.matchAll([1, 1, 1, 1], "ones"))

print("defining example 2")
eval(BSOMetaJSTranslator.match(BSOMetaJSParser.matchAll("ometa M { foo = &(:x) anything*:ys -> [x, ys] }", "srcElem"), "trans"))
print("running example 2")
print(M.matchAll([1, 2, 3, 4], "foo"))

print("defining example 3")
eval(BSOMetaJSTranslator.match(BSOMetaJSParser.matchAll("ometa M { ones = {count=0} ({count++} 1 -> 2)* }", "srcElem"), "trans"))
print("running example 3")
print(M.matchAll([1, 1, 1, 1], "ones"))
print("count = " + count)

