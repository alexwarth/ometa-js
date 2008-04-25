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
  var url = "projects/" + name + ".txt"
  var ok = true

  if (document.location.protocol == "file:") { return saveFileWithMozilla(url, text) };

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
function saveFileWithMozilla(url, content)
{
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

    if(window.Components)
        try
            {
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
            return(true);
            }
        catch(e)
            {
            alert("Exception while attempting to save\n\n" + e);
            return(false);
            }
    return(null);
}

function projectIsDirty() { return $('workspaceForm').source.value != $('workspaceForm').source.origValue }
dirtyAreYouSureMessage = "The changes you have made to this project will be lost unless you press 'cancel' " +
                         "and save your work. Proceed?"

// window.onbeforeunload = function() { if (projectIsDirty()) return dirtyAreYouSureMessage }

function loadProject() {
  if (arguments.length > 0) {
    if (arguments[0] == "" || "#" + arguments[0] == document.location.hash)
      return
    document.location.hash = hashChangedHandler.oldHash = "#" + arguments[0]
  }
  //  if (projectIsDirty() && !confirm(dirtyAreYouSureMessage))
  //    return
  var projName = document.location.hash.substring(1),
      projData = readFile(projName)
  $('workspaceForm').source.value     = projData
  $('workspaceForm').source.origValue = projData
  $('title').innerHTML = "<font color=#000088>" + projName.replace(/_/g, " ") + "</font>"

  myEditor.setEditorHTML(projData);
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

