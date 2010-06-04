// Copyright (c) 2008, 2010 Alessandro Warth <awarth@cs.ucla.edu>

DEBUG = false;

// getTag: object -> unique id
// tagToRef: unique id -> object

// Note: this hashing scheme causes a huge memory leak (all b/c JS doesn't support weak references)

(function() {
  var numIdx = 0, tagToRef = {}
  var _getTag = function(r) {
    if (r === null || r === undefined)
      return r
    switch (typeof r) {
      case "boolean": return r == true ? "Btrue" : "Bfalse"
      case "string":  return "S" + r
      case "number":  return "N" + r
      default:        return r.hasOwnProperty("_id_") ? r._id_ : r._id_ = "R" + numIdx++
    }
  }
  getTag = function(r) {
    var tag = _getTag(r)
    tagToRef[tag] = r
    return tag
  }
  getRef = function(t) {
    return tagToRef[t]
  }
})()

// implementation of possible worlds

worldProto = {}

baseWorld = thisWorld = (function() {
  var writes = {}
  return {
    parent: worldProto,
    writes: writes,
    hasOwn: function(r, p) {
      var id = getTag(r)
      return writes.hasOwnProperty(id) && writes[id].hasOwnProperty(p)
    },
    has: function(r, p) {
      return this.hasOwn(r, p) ||
             r !== Object.prototype && this.has(r === null || r === undefined ? Object.prototype : r.parent, p)
    },
    props: function(r, ps) {
      var id = getTag(r)
      if (writes.hasOwnProperty(id))
        for (var p in writes[id])
          if (writes[id].hasOwnProperty(p))
            ps[p] = true
      if (r !== Object.prototype)
        this.props(r === null || r === undefined ? Object.prototype : r.parent, ps)
      return ps
    },
    _get: function(r, p) {
      var id = getTag(r)
      if (DEBUG) console.log("? top-level world looking up " + id + "." + p)
      if (writes.hasOwnProperty(id) && writes[id].hasOwnProperty(p))
        return writes[id][p]
      else if (r !== Object.prototype)
        return thisWorld._get(r === null || r === undefined ? Object.prototype : r.parent, p)
      else
        return undefined
    },
    get: function(r, p) {
      // the top-level world's commit operation is a no-op, so reads don't have to be recorded
      if (typeof r === "string" && (typeof p === "number" || p === "length"))
        return r[p]
      else
        return this._get(r, p)
    },
    set: function(r, p, v) {
      if (typeof r === "string" && (typeof p === "number" || p === "length"))
        throw "the indices and length of a string are immutable, and you tried to change them!"
      var id = getTag(r)
      if (DEBUG) console.log("! top-level world assigning to " + id + "." + p)
      if (!writes.hasOwnProperty(id))
        writes[id] = {}
      writes[id][p] = v
      return v
    },
    commit: function() { },
    sprout: function() {
      var parentWorld = this, writes = {}, reads = {}
      return {
        parent: worldProto,
        writes: writes,
        reads:  reads,
        hasOwn: function(r, p) {
          var id = getTag(r)
          return writes.hasOwnProperty(id) && writes[id].hasOwnProperty(p) ||
                 reads.hasOwnProperty(id)  && reads[id].hasOwnProperty(p)  ||
                 parentWorld.hasOwn(r, p)
        },
        has: function(r, p) {
          return this.hasOwn(r, p) ||
                 r !== Object.prototype && this.has(r === null || r === undefined ? Object.prototype : r.parent, p)
        },
        props: function(r, ps) {
          var id = getTag(r)
          if (writes.hasOwnProperty(id))
            for (var p in writes[id])
              if (writes[id].hasOwnProperty(p))
                ps[p] = true
          if (reads.hasOwnProperty(id))
            for (var p in reads[id])
              if (reads[id].hasOwnProperty(p))
                ps[p] = true
          if (r !== Object.prototype)
            this.props(r === null || r === undefined ? Object.prototype : r.parent, ps)
          parentWorld.props(r, ps)
          return ps
        },
        _get: function(r, p) {
          var id = getTag(r)
          if (DEBUG) console.log("? child world looking up " + id + "." + p)
          if      (writes.hasOwnProperty(id) && writes[id].hasOwnProperty(p))
            return writes[id][p]
          else if (reads.hasOwnProperty(id)  && reads[id].hasOwnProperty(p))
            return reads[id][p]
          else
            return parentWorld._get(r, p)
        },
        get: function(r, p) {
          if (typeof r === "string" && (typeof p === "number" || p === "length"))
            return r[p]
          var id = getTag(r), ans = this._get(r, p)
          if (!reads.hasOwnProperty(id)) {
            reads[id] = {}
            if (!reads[id].hasOwnProperty(p))
              reads[id][p] = ans
          }
          return ans
        },
        set: function(r, p, v) {
          if (typeof r === "string" && (typeof p === "number" || p === "length"))
            throw "the indices and length of a string are immutable, and you tried to change them!"
          var id = getTag(r)
          if (DEBUG) console.log("! child world assigning to " + id + "." + p)
          if (!writes.hasOwnProperty(id))
            writes[id] = {}
          writes[id][p] = v
          return v
        },
        commit: function() {
          // serializability check
          for (var id in reads) {
            if (!reads.hasOwnProperty(id))
              continue
            for (var p in reads[id]) {
              if (!reads[id].hasOwnProperty(p))
                continue
              else if (reads[id][p] !== parentWorld._get(getRef(id), p))
                throw "commit failed"
            }
          }
          // propagation of side effects
          for (var id in writes) {
            if (!writes.hasOwnProperty(id))
              continue
            for (var p in writes[id]) {
              if (!writes[id].hasOwnProperty(p))
                continue
              if (!parentWorld.writes.hasOwnProperty(id))
                parentWorld.writes[id] = {}
              if (DEBUG) console.log("committing " + id + "." + p)
              parentWorld.writes[id][p] = writes[id][p]
            }
          }
          writes = {}
          reads  = {}
        },
        sprout: parentWorld.sprout
      }
    }
  }
})()
worldStack = [thisWorld]

// Lexical scopes

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

