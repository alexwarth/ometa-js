function readFile(name) {
  var r
  new Ajax.Request("projects/" + name + ".txt", {
    method:       "get",
    asynchronous: false,
    onSuccess:    function(transport) { r = transport.responseText },
    onFailure:    function(transport) { r = "" },
    onException:  function(x)         { console.log(x) }
  })
  return r
}

function writeFile(name, text) {
  var ok = true
  new Ajax.Request("projects/" + name + ".txt", {
    method:       "put",
    asynchronous: false,
    postBody:     text,
    onFailure:    function() { ok = false }
  })
  if (!ok)
    throw "unable to write file '" + name + "'"
}

function projectIsDirty() { return $('workspaceForm').source.value != $('workspaceForm').source.origValue }
dirtyAreYouSureMessage = "The changes you have made to this project will be lost unless you press 'cancel' " +
                         "and save your work. Proceed?"

window.onbeforeunload = function() { if (projectIsDirty()) return dirtyAreYouSureMessage }

function loadProject() {
  if (arguments.length > 0) {
    if (arguments[0] == "" || "#" + arguments[0] == document.location.hash)
      return
    document.location.hash = hashChangedHandler.oldHash = "#" + arguments[0]
  }
  if (projectIsDirty() && !confirm(dirtyAreYouSureMessage))
    return
  var projName = document.location.hash.substring(1),
      projData = readFile(projName)
  $('workspaceForm').source.value     = projData
  $('workspaceForm').source.origValue = projData
  $('title').innerHTML = "<font color=#000088>" + projName.replace(/_/g, " ") + "</font>" + titleRest
}

function saveProject() {
  try {
    var projName = document.location.hash.substring(1),
        projData = $('workspaceForm').source.value
    // the following is an ugly hack to fix a bug in prototype.js
    if (projData == "")
      projData = " "
    writeFile(projName, projData)
    $('workspaceForm').source.origValue = projData
    alert("Project '" + projName + "' saved")
  }
  catch (e) {
    alert("Error: " + e + "\n" +
          "Please save your work locally (by cutting and pasting),\n" +
          "and let Alex know about this problem.")
    throw e
  }
}

hashChangedHandler = function() {
  if (document.location.hash == hashChangedHandler.oldHash)
    return
  hashChangedHandler.oldHash = document.location.hash
  loadProject()
}
hashChangedHandler.oldHash    = document.location.hash
hashChangedHandler.intervalId = setInterval(hashChangedHandler, 1000)

