/*
  Copyright (c) 2007, 2008 Alessandro Warth <awarth@cs.ucla.edu>

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/

/*
  new syntax:
    #foo	match the string object 'foo' (should also be accepted in JS)
    'abc'	match the string object 'abc'
    'c'		match the string object 'c'
    ``abc''	match the sequence of string objects 'a', 'b', 'c'
    "abc"	token('abc')
    [1 2 3]	match the array object [1, 2, 3]
    foo(bar)	apply rule foo with argument bar
    -> ...	do semantic actions in JS (no more ST). allow multiple statements, but no declarations
		probably don't even need {}s, because newlines can terminate it!
*/

/*
// ometa M {
//   number = number:n digit:d -> { n * 10 + d.digitValue() }
//          | digit:d          -> { d.digitValue() }.
// }

try {
  M = OMeta.delegated({
    number: function() {
      var $elf = this
      return $elf._or(
        function() {
          var n, d
          n = $elf._apply("number")
          d = $elf._apply("digit")
          return n * 10 + d.digitValue()
        },
        function() {
          var d
          d = $elf._apply("digit")
          return d.digitValue()
        }
      )
    }
  })
  M.matchAll("123456789", "number")
} catch (f) { alert(f) }
*/

// the failure exception

fail = { toString: function() { return "match failed" } }

// streams and memoization

function OMInputStream(hd, tl) {
  this.memo = { }
  this.hd   = hd
  this.tl   = tl
}
OMInputStream.prototype.head = function() { return this.hd }
OMInputStream.prototype.tail = function() { return this.tl }

function OMInputStreamEnd() { this.memo = { } }
OMInputStreamEnd.prototype.head = function() { throw fail }
OMInputStreamEnd.prototype.tail = function() { throw fail }

Array.prototype.toOMInputStream  = function() { return makeArrayOMInputStream(this, 0) }
String.prototype.toOMInputStream = Array.prototype.toOMInputStream

function makeArrayOMInputStream(arr, idx) { return idx < arr.length ? new ArrayOMInputStream(arr, idx) : new OMInputStreamEnd() }

function ArrayOMInputStream(arr, idx) {
  this.memo = { }
  this.arr  = arr
  this.idx  = idx
  this.hd   = arr[idx]
}
ArrayOMInputStream.prototype.head = function() { return this.hd }
ArrayOMInputStream.prototype.tail = function() {
  if (this.tl == undefined)
    this.tl = makeArrayOMInputStream(this.arr, this.idx + 1)
  return this.tl
}

function makeOMInputStreamProxy(target) {
  return target.delegated({
    memo:   { },
    target: target,
    tail:   function() { return makeOMInputStreamProxy(target.tail()) }
  })
}

// Failer (i.e., that which makes things fail) is used to detect (direct) left recursion and memoize failures

function Failer() { }
Failer.prototype.used = false

// the OMeta "class" and basic functionality

OMeta = {
  _apply: function(rule) {
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
  },

  // note: _applyWithArgs and _superApplyWithArgs are not memoized, so they can't be left-recursive
  _applyWithArgs: function(rule) {
    for (var idx = arguments.length - 1; idx > 0; idx--)
      this.input = new OMInputStream(arguments[idx], this.input)
    return this[rule].apply(this)
  },
  _superApplyWithArgs: function($elf, rule) {
    for (var idx = arguments.length - 1; idx > 1; idx--)
      $elf.input = new OMInputStream(arguments[idx], $elf.input)
    return this[rule].apply($elf)
  },
  _pred: function(b) {
    if (b)
      return true
    throw fail
  },
  _not: function(x) {
    var origInput = this.input
    try { x() }
    catch (f) {
      if (f != fail)
        throw f
      this.input = origInput
      return true
    }
    throw fail
  },
  _lookahead: function(x) {
    var origInput = this.input,
        r        = x()
    this.input = origInput
    return r
  },
  _or: function() {
    var origInput = this.input
    for (var idx = 0; idx < arguments.length; idx++)
      try { this.input = origInput; return arguments[idx]() }
      catch (f) {
        if (f != fail)
          throw f
      }
    throw fail
  },
  _many: function(x) {
    var ans = arguments[1] != undefined ? [arguments[1]] : []
    while (true) {
      var origInput = this.input
      try { ans.push(x()) }
      catch (f) {
        if (f != fail)
          throw f
        this.input = origInput
        break
      }
    }
    return ans
  },
  _many1: function(x) { return this._many(x, x()) },
  _form: function(x) {
    var v = this._apply("anything")
    if (!v.isSequenceable)
      throw fail
    var origInput = this.input
    this.input = makeArrayOMInputStream(v, 0)
    var r = x()
    this._apply("end")
    this.input = origInput
    return v
  },

  // some basic rules
  anything: function() {
    var r = this.input.head()
    this.input = this.input.tail()
    return r
  },
  end: function() {
    var $elf = this
    return this._not(function() { return $elf._apply("anything") })
  },
  empty: function() { return true },
  apply: function() {
    var r = this._apply("anything")
    return this._apply(r)
  },
  foreign: function() {
    var g   = this._apply("anything"),
        r   = this._apply("anything"),
        gi  = g.delegated({input: makeOMInputStreamProxy(this.input)})
    var ans = gi._apply(r)
    this.input = gi.input.target
    return ans
  },

  //  some useful "derived" rules
  exactly: function() {
    var wanted = this._apply("anything")
    if (wanted === this._apply("anything"))
      return wanted
    throw fail
  },
  "true": function() {
    var r = this._apply("anything")
    this._pred(r == true)
    return r
  },
  "false": function() {
    var r = this._apply("anything")
    this._pred(r == false)
    return r
  },
  "undefined": function() {
    var r = this._apply("anything")
    this._pred(r == undefined)
    return r
  },
  number: function() {
    var r = this._apply("anything")
    this._pred(r.isNumber())
    return r
  },
  string: function() {
    var r = this._apply("anything")
    this._pred(r.isString())
    return r
  },
  char: function() {
    var r = this._apply("anything")
    this._pred(r.isCharacter())
    return r
  },
  space: function() {
    var r = this._apply("char")
    this._pred(r.charCodeAt(0) <= 32)
    return r
  },
  spaces: function() {
    var $elf = this
    return this._many(function() { return $elf._apply("space") })
  },
  digit: function() {
    var r = this._apply("char")
    this._pred(r.isDigit())
    return r
  },
  lower: function() {
    var r = this._apply("char")
    this._pred(r.isLower())
    return r
  },
  upper: function() {
    var r = this._apply("char")
    this._pred(r.isUpper())
    return r
  },
  letter: function() {
    var $elf = this
    return this._or(function() { return $elf._apply("lower") },
                    function() { return $elf._apply("upper") })
  },
  letterOrDigit: function() {
    var $elf = this
    return this._or(function() { return $elf._apply("letter") },
                    function() { return $elf._apply("digit")  })
  },
  firstAndRest: function()  {
    var $elf  = this,
        first = this._apply("anything"),
        rest  = this._apply("anything")
     return this._many(function() { return $elf._apply(rest) }, this._apply(first))
  },
  seq: function() {
    var xs = this._apply("anything")
    for (var idx = 0; idx < xs.length; idx++)
      this._applyWithArgs("exactly", xs[idx])
    return xs
  },
  notLast: function() {
    var $elf = this,
        rule = this._apply("anything"),
        r    = this._apply(rule)
    this._lookahead(function() { return $elf._apply(rule) })
    return r
  },

  initialize: function() { },
  // match and matchAll are a grammar's "public interface"
  _genericMatch: function(input, rule, args, matchFailed) {
    if (args == undefined)
      args = []
    var realArgs = [rule]
    for (var idx = 0; idx < args.length; idx++)
      realArgs.push(args[idx])
    var m = this.delegated({input: input})
    m.initialize()
    try { return realArgs.length == 1 ? m._apply.call(m, realArgs[0]) : m._applyWithArgs.apply(m, realArgs) }
    catch (f) {
      if (f == fail && matchFailed != undefined) {
        var input = m.input
        if (input.idx != undefined) {
          while (input.tl != undefined && input.tl.idx != undefined)
            input = input.tl
          input.idx--
        }
        return matchFailed(m, input.idx)
      }
      throw f
    }
  },
  match: function(obj, rule, args, matchFailed) {
    return this._genericMatch([obj].toOMInputStream(),    rule, args, matchFailed)
  },
  matchAll: function(listyObj, rule, args, matchFailed) {
    return this._genericMatch(listyObj.toOMInputStream(), rule, args, matchFailed)
  }
}

