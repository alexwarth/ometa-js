/*
  Copyright (c) 2008 Alessandro Warth <awarth@cs.ucla.edu>
*/

DEBUG = false

// object -> unique id
// Note: one good thing about this funny object hashing scheme is that it makes worlds a bit like weak arrays, i.e., they
// don't get in the way of proper GC.

Object.prototype.getTag = (function() {
  var numIds = 0
  return function() { return this.hasOwnProperty("_id_") ? this._id_ : this._id_ = "R" + numIds++ }
})()
Boolean.prototype.getTag = function() { return this }
String.prototype.getTag  = function() { return "S" + this }
Number.prototype.getTag  = function() { return "N" + this }

getTag = function(x) { return x === null || x === undefined ? x : x.getTag() }

// implementation of possible worlds

worldProto = {}

baseWorld = thisWorld = (function() {
  var deltas = {}
  return {
    parent: worldProto,
    deltas: deltas,
    hasOwn: function(r, p) {
      var id = getTag(r)
      return deltas.hasOwnProperty(id) && deltas[id].hasOwnProperty(p)
    },
    has: function(r, p) {
      var id = getTag(r)
      return deltas.hasOwnProperty(id) && deltas[id].hasOwnProperty(p)
    },
    props: function(x, ps) {
      var id = getTag(x)
      if (deltas.hasOwnProperty(id))
        for (var p in deltas[id])
          if (deltas[id].hasOwnProperty(p))
            ps[p] = true
      if (x !== Object.prototype)
        this.props(x === null || x === undefined ? Object.prototype : x.parent, ps)
      return ps
    },
    get: function(r, p) {
      if (r && r.constructor === String && (p === 0 || p && p.constructor === Number || p === "length"))
        return r[p]
      var id = getTag(r)
      if (DEBUG) console.log("? parent world looking up " + id + "." + p)
      if (deltas.hasOwnProperty(id) && deltas[id].hasOwnProperty(p))
        return deltas[id][p]
      else if (r === Object.prototype)
        return undefined
      else
        return this.get(r === null || r === undefined ? Object.prototype : r.parent, p)
    },
    set: function(r, p, v) {
      var id = getTag(r)
      if (DEBUG) console.log("! parent world assigning to " + id + "." + p)
      if (!deltas.hasOwnProperty(id))
        deltas[id] = {}
      deltas[id][p] = v
      return v
    },
    commit: function() { },
    sprout: function() {
      var parentWorld = this, deltas = {}
      return {
        parent: parentWorld,
        deltas: deltas,
        hasOwn: function(r, p) {
          var id = getTag(r)
          return deltas.hasOwnProperty(id) && deltas[id].hasOwnProperty(p)
        },
        has: function(r, p) {
          return this.hasOwn(r, p) || parentWorld.has(r, p)
        },
        props: function(x, ps) {
          var id = getTag(x)
          if (deltas.hasOwnProperty(id))
            for (var p in deltas[id])
              if (deltas[id].hasOwnProperty(p))
                ps[p] = true
          if (x !== Object.prototype)
            this.props(x === null || x === undefined ? Object.prototype : x.parent, ps)
          parentWorld.props(x, ps)
          return ps
        },
        get: function(r, p) {
          if (r && r.constructor === String && (p === 0 || p && p.constructor === Number || p === "length"))
            return r[p]
          var id = getTag(r)
          if (DEBUG) console.log("? child world looking up " + id + "." + p)
          return deltas.hasOwnProperty(id) && deltas[id].hasOwnProperty(p) ?
                   deltas[id][p] :
                   parentWorld.get.call(this, r, p)
        },
        set: function(r, p, v) {
          var id = getTag(r)
          if (DEBUG) console.log("! child world assigning to " + id + "." + p)
          if (!deltas.hasOwnProperty(id))
            deltas[id] = {}
          deltas[id][p] = v
          return v
        },
        commit: function() {
          for (var i in deltas) {
            if (!deltas.hasOwnProperty(i))
              continue
            for (var p in deltas[i]) {
              if (!deltas[i].hasOwnProperty(p))
                continue
              if (!parentWorld.deltas.hasOwnProperty(i))
                parentWorld.deltas[i] = {}
              if (DEBUG) console.log("committing " + i + "." + p)
              parentWorld.deltas[i][p] = deltas[i][p]
            }
          }
          deltas = {}
        },
        sprout: parentWorld.sprout
      }
    }
  }
})()
worldStack = [thisWorld]

// Lexical scopes

// TODO: look into the following (old) comment, which I think is no longer true
// Note: I'm not very happy about using undefined to denote that a variable is not declared, since it allows programmers to
//   dynamically undeclare variables via assignment. One solution might be to make "undefined" only accessible at the impl. level,
//   but it would be even better to actually solve this problem.

GlobalScope = function() { }
GlobalScope.prototype = {
  parent:    Object.prototype,
  hasOwn:    function(n)    { return thisWorld.hasOwn(this, n)  },
  has:       function(n)    { return thisWorld.has(this, n)     },
  get:       function(n)    { return thisWorld.get(this, n)     },
  set:       function(n, v) { return thisWorld.set(this, n, v)  },
  decl:      function(n, v) { return baseWorld.set(this, n, v)  },
  makeChild: function()     { return new ActivationRecord(this) }
}

ActivationRecord = function(parent) { this.parent = parent }
ActivationRecord.prototype = new GlobalScope()
ActivationRecord.prototype.get = function(n)    { return thisWorld.has(this, n) ?
                                                           thisWorld.get(this, n) :
                                                           this.parent.get(n)          }
ActivationRecord.prototype.set = function(n, v) { return thisWorld.has(this, n) ?
                                                           thisWorld.set(this, n, v) :
                                                           this.parent.set(n, v)       }

thisScope = new GlobalScope()

// Sends

send = function(sel, recv, args) {
  //alert("doing a send, sel=" + sel + ", recv=" + recv + ", args=" + args)
  return thisWorld.get(recv, sel).apply(recv, args)
}

// New

Function.prototype.worldsNew = function() {
  var r = {parent: thisWorld.get(this, "prototype")}
  this.apply(r, arguments)
  return r
}

// instanceof

instanceOf = function(x, C) {
  var p = x.parent, Cp = thisWorld.get(C, "prototype")
  while (p != undefined) {
    if (p == Cp)
      return true
    p = p.parent
  }
  return false
}

// Some globals, etc.

wObject  = function() { }
thisScope.decl("Object",  wObject)
thisWorld.set(wObject, "prototype", Object.prototype)
thisWorld.set(Object.prototype, "hasOwn", function(p) { return thisWorld.has(this, p) })
thisWorld.set(Object.prototype, "toString", function() { return "" + this })

thisWorld.set(worldProto, "sprout",   function() { return this.sprout()                   })
thisWorld.set(worldProto, "commit",   function() { return this.commit()                   })
thisWorld.set(worldProto, "toString", function() { return "[World " + this.getTag() + "]" })

wWorld    = function() { }; thisScope.decl("World",    wWorld);    thisWorld.set(wWorld,    "prototype", worldProto)
wBoolean  = function() { }; thisScope.decl("Boolean",  wBoolean);  thisWorld.set(wBoolean,  "prototype", {parent: Object.prototype})
wNumber   = function() { }; thisScope.decl("Number",   wNumber);   thisWorld.set(wNumber,   "prototype", {parent: Object.prototype})
wString   = function() { }; thisScope.decl("String",   wString);   thisWorld.set(wString,   "prototype", {parent: Object.prototype})
wArray    = function() { }; thisScope.decl("Array",    wArray);    thisWorld.set(wArray,    "prototype", {parent: Object.prototype})
wFunction = function() { }; thisScope.decl("Function", wFunction); thisWorld.set(wFunction, "prototype", {parent: Object.prototype})

Boolean.prototype.parent   = thisWorld.get(wBoolean,   "prototype")
Number.prototype.parent    = thisWorld.get(wNumber,    "prototype")
String.prototype.parent    = thisWorld.get(wString,    "prototype")
Function.prototype.parent  = thisWorld.get(wFunction,  "prototype")
// Don't need to do this for Array because Worlds/JS arrays are not JS arrays

thisWorld.set(wString, "fromCharCode", function(x) { return String.fromCharCode(x) })
thisWorld.set(String.prototype.parent, "charCodeAt", function(x) { return this.charCodeAt(x) })

thisWorld.set(Function.prototype.parent, "apply", function(recv, args) {
  var jsArgs
  if (args && thisWorld.get(args, "length") > 0) {
    jsArgs = []
    for (var idx = 0; idx < thisWorld.get(args, "length"); idx++)
      jsArgs.push(thisWorld.get(args, idx))
  }
  return this.apply(recv, jsArgs)
})
thisWorld.set(Function.prototype.parent, "call", function(recv) {
  var jsArgs = []
  for (var idx = 1; idx < arguments.length; idx++)
    jsArgs.push(arguments[idx])
  return this.apply(recv, jsArgs)
})

thisScope.decl("null",      null)
thisScope.decl("undefined", undefined)
thisScope.decl("true",      true)
thisScope.decl("false",     false)

thisScope.decl("jsEval",  function(s) { return eval(thisWorld.get(s, "toString").call(s))    })
thisScope.decl("print",   function(s) { print(thisWorld.get(s, "toString").call(s))          })
thisScope.decl("alert",   function(s) { alert(thisWorld.get(s, "toString").call(s))          })
thisScope.decl("prompt",  function(s) { return prompt(thisWorld.get(s, "toString").call(s))  })
thisScope.decl("confirm", function(s) { return confirm(thisWorld.get(s, "toString").call(s)) })

thisScope.decl("parseInt",   function(s) { return parseInt(s)   })
thisScope.decl("parseFloat", function(s) { return parseFloat(s) })

WorldsConsole = {}
thisScope.decl("console", WorldsConsole)
thisWorld.set(WorldsConsole, "log", function(s) { Transcript.show(thisWorld.get(s, "toString").apply(s)) })

Array.prototype.toWJSArray = function() {
  var r = wArray.worldsNew()
  for (var idx = 0; idx < this.length; idx++)
    thisWorld.set(r, idx, this[idx])
  thisWorld.set(r, "length", this.length)
  return r
}
Object.prototype.toWJSObject = function() {
  var r = wObject.worldsNew()
  for (var p in this)
    if (this.hasOwnProperty(p))
      thisWorld.set(r, p, this[p])
  return r
}

