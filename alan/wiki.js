// Wiki provides user strage on a WebDAV server or local storage.
// It depends on prototype.js
//
// Usage:
// var wiki = new Wiki()
// wiki.contentsChanged = function(aString) { alert(aString) }
// wiki.save("Hello, world!")
// window.onload = function() { wiki.init() }

function Wiki() {
  // location of data
  this.storage = "projects/"
  // suffix of data file
  this.suffix = ".txt"
  // name of default project
  this.defaultTitle = "Sample_Project"
  // callback function which to know if content is changed.
  this.isDirty = function() { return false }
  // callback function called when URL is changed
  this.contentsChanged = function(aString) { alert("Contents: " + aString) }
  this.oldHash = null
}

Wiki.prototype.init = function () {
  var self = this
  var hashChangedHandler = function() {
    if (document.location.hash == self.oldHash)
      return

    if (document.location.hash == "") {
      if (self.oldHash == null) {
        document.location.hash = "#" + self.defaultTitle
      } else {
        document.location.hash = self.oldHash
        return
      }
    }
    self.oldHash = document.location.hash
    self.loadProject()
  }
  this.intervalId = setInterval(hashChangedHandler, 1000)

  window.onbeforeunload = function() {
    if (self.isDirty()) return dirtyAreYouSureMessage
  }
  hashChangedHandler()
}

Wiki.prototype.title = function () {
  return this._title.replace(/_/g, " ")
}

Wiki.prototype.readFile = function(name) {
  var r
  new Ajax.Request(this.storage + name + this.suffix, {
    method:       "get",
    asynchronous: false,
    onSuccess:    function(transport) { r = transport.responseText },
    onFailure:    function(transport) { r = "" },
    onException:  function(x)         { console.log(x) }
  })
  return r
}

Wiki.prototype.writeFile = function(name, text) {
  var url = this.storage + name + this.suffix
  var ok = true

  if (document.location.protocol == "file:") {
    return this.saveFileWithMozilla(url, text)
  }

  new Ajax.Request(url, {
    method:       "put",
    asynchronous: false,
    postBody:     text,
    onFailure:    function() { ok = false }
  })
  if (!ok)
    throw "unable to write file '" + name + "'"
}

// http://ask.metafilter.com/34651/Saving-files-with-Javascript
Wiki.prototype.saveFileWithMozilla = function(url, content) {
  // very naive path conversion
  var filePath;
  var pathname = location.pathname;
  if(pathname.charAt(2) == ":") {
	var directory = pathname.replace(/[^/]*$/, "").slice(1);
	filePath = (directory + url).replace(new RegExp("/","g"),"\\");
  } else {
	var directory = location.pathname.replace(/[^/]*$/, "");
	filePath = (directory + url);
  }

  if(window.Components) {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filePath);
    if (!file.exists())
      file.create(0, 0664);
    var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    out.init(file, 0x20 | 0x02, 00004,null);
    out.write(content, content.length);
    out.flush();
    out.close();
  } else {
    throw "window.Content is not found.";
  }
}

Wiki.prototype.dirtyAreYouSureMessage = "The changes you have made to this project will be lost unless you press 'cancel' " +
                         "and save your work. Proceed?"

Wiki.prototype.loadProject = function() {
  if (arguments.length > 0) {
    if (arguments[0] == "" || "#" + arguments[0] == document.location.hash)
      return
    document.location.hash = this.oldHash = "#" + arguments[0]
  }
  if (this.isDirty() && !confirm(this.dirtyAreYouSureMessage))
    return
  var projName = document.location.hash.substring(1),
      projData = this.readFile(projName)
  this._title = projName
  this.contentsChanged(projData);
}

Wiki.prototype.save = function(aString) {
  try {
    var projName = document.location.hash.substring(1)
    // the following is an ugly hack to fix a bug in prototype.js
    if (aString == "")
      aString = " "
    this.writeFile(projName, aString)
    alert("Project '" + projName + "' saved")
  }
  catch (e) {
    alert("Error: " + e + "\n" +
          "Please save your work locally (by cutting and pasting),\n" +
          "and let Alex know about this problem.")
    throw e
  }
}
