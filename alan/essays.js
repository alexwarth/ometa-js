var toolbar = {
  collapse: true,
  titlebar: 'Active Essays',
  draggable: false,
  buttons: [
    { group: 'fontstyle', label: 'Font Name and Size',
      buttons: [
        { type: 'select', label: 'Arial', value: 'fontname', disabled: true,
          menu: [
            { text: 'Arial', checked: true },
            { text: 'Arial Black' },
            { text: 'Comic Sans MS' },
            { text: 'Courier New' },
            { text: 'Lucida Console' },
            { text: 'Tahoma' },
            { text: 'Times New Roman' },
            { text: 'Trebuchet MS' },
            { text: 'Verdana' }
          ]
        },
        { type: 'spin', label: '13', value: 'fontsize', range: [ 9, 75 ], disabled: true }
      ]
    },
    { type: 'separator' },
    { group: 'textstyle', label: 'Font Style',
      buttons: [
        { type: 'push', label: 'Bold CTRL + SHIFT + B', value: 'bold' },
        { type: 'push', label: 'Italic CTRL + SHIFT + I', value: 'italic' },
        { type: 'push', label: 'Underline CTRL + SHIFT + U', value: 'underline' },
        { type: 'separator' },
        { type: 'color', label: 'Font Color', value: 'forecolor', disabled: true },
        { type: 'color', label: 'Background Color', value: 'backcolor', disabled: true }
      ]
    },
    { type: 'separator' },
    { group: 'indentlist', label: 'Lists',
      buttons: [
        { type: 'push', label: 'Create an Unordered List', value: 'insertunorderedlist' },
        { type: 'push', label: 'Create an Ordered List', value: 'insertorderedlist' }
      ]
    },
    { type: 'separator' },
    { group: 'insertitem', label: 'Insert Item',
      buttons: [
        { type: 'push', label: 'HTML Link CTRL + SHIFT + L', value: 'createlink', disabled: true },
        { type: 'push', label: 'Insert Image', value: 'insertimage' }
      ]
    },
    { type: 'separator' },
    { group: 'Workspace', label: 'Workspace',
      buttons: [
        { type: 'push', label: 'Save CTRL + S', value: 'save'},
        { type: 'push', label: 'Do It CTRL + D', value: 'doit' },
        { type: 'push', label: 'Show HTML', value: 'showHTML' }
      ]
    }
  ]
}

var myEditor = new YAHOO.widget.SimpleEditor('source', {
  // Width and height are specified by the textarea
  dompath: true, //Turns on the bar at the bottom
  toolbar: toolbar,
  markup: "xhtml",
});
myEditor.render();

myEditor.on("toolbarLoaded", function() {
  
//   this.toolbar.addSeparator();
//   this.toolbar.addButtonGroup({ group: 'file', label: 'File',
//     buttons: [
//       { type: 'push', label: 'Save CTRL + S', value: 'save'},
//       { type: 'push', label: 'Do It CTRL + D', value: 'doit' }
//     ]
//   });

  myEditor.toolbar.on("saveClick", save);
  myEditor.toolbar.on("doitClick", doit);
  myEditor.toolbar.on("showHTMLClick", showHTML);
  myEditor.on("editorMouseUp", onMouseUp);
});

myEditor.on("editorContentLoaded", function() {
  wiki.init();
});

function save() {
  wiki.save(myEditor.cleanHTML(myEditor.getEditorHTML()))
}

function doit() {
  if (!myEditor._hasSelection())
    return
  var sel = myEditor._getSelection().toString()
  println(eval(translateCode(sel)))
}

function showHTML() {
  var range = myEditor._getRange();
  if (!range) return
  var contents = range.cloneContents()
  var div = document.createElement("div")
  div.appendChild(contents)
  println(div.innerHTML)
}

// Handle anchor tag for YUI editor
function onMouseUp(e) {
  var element = e.ev.element();
  if (element.tagName == "A") {
    var href = element.getAttribute("href")
    if (href.charAt(0) == "#") href = location.pathname + href
    document.location.href = href
    YAHOO.util.Event.preventDefault(e);
  }
}

function translateCode(s) {
  var translationError = function(m, i) { alert("Translation error - please tell Alex about this!"); throw fail },
      tree             = BSOMetaJSParser.matchAll(s, "topLevel", undefined, function(m, i) { throw fail.delegated({errorPos: i}) })
  return BSOMetaJSTranslator.match(tree, "trans", undefined, translationError)
}

var wiki = new Wiki()
// wiki.isDirty = function() { return myEditor.editorDirty }
wiki.contentsChanged = function(aString) {
  if (aString == undefined) { aString = "" }
  myEditor.setEditorHTML(aString)
//  $('title').innerHTML = "<font color=#000088>" + wiki.title() + "</font>"

  myEditor.toolbar._titlebar.firstChild.firstChild.innerHTML = wiki.title()
  document.title = wiki.title()
}

function println(string) {
  $("transcript").value += string + "\n";
}
