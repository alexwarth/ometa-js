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

// This code was adapted from Takashi Yamamiya's Javascript Workspace,
// which you can visit at http://metatoys.org/propella/js/workspace.js

// ---------------------------------------------------------------------------------------------------------------------------

// INSTRUCTIONS: a client page must (1) include something along these lines:

/*
  <body onLoad="$('workspaceForm').onkeydown=onShortCutKey">
    ...
    <form id=workspaceForm>
      <b>Source</b><br>
      <textarea cols=132 rows=24 name=source>...</textarea><br>
      <input type=button value="print it (ctrl+p)" onClick="printIt()">
      <input type=button value="do it (ctrl+d)" onClick="doIt()">
      <br><br>
      <b>Translation</b>
      <br>
      <div id=translation>
        <textarea cols=132 rows=4 name=translation>
        </textArea>
      </div>
      <b>Transcript</b>
      <br>
      <div id=transcript>
        <textarea cols=132 rows=4 name=transcript></textArea>
      </div>
    </form>
    ...
  </body>
*/

// and (2) define its own translateCode function

function translateCode(s) {
  //throw { errorPos: 0 }
  return s
}

// ---------------------------------------------------------------------------------------------------------------------------

/* event handler for short cut key */
function onShortCutKey(evt) {
  evt = evt ? evt : window.event;
  if (!evt)
    return undefined;
  if (!(evt.altKey || evt.ctrlKey || evt.metaKey))
    return true;
  var charCode = evt.charCode ? evt.charCode : evt.keyCode
  try {
    var handledIt = true
    switch (charCode) {
      case 68: doIt();            break
      case 80: printIt();         break
      case 83: saveIt();          break
      default: handledIt = false; return true
    }
  }
  finally {
    if (handledIt) {
      if (evt.preventDefault) {
        evt.preventDefault()
        evt.stopPropagation()
      }
      else {
        evt.returnValue  = false
        evt.cancelBubble = true
      }
    }
  }
  return false
}

function printIt() {
  var result       = evalSelection()
  if (!result)
    return
  var editor       = result.source.editor,
      end          = result.source.end,
      head         = editor.value.substring(0, end),
      tail         = editor.value.substring(end),
      oldScrollTop = editor.scrollTop
  editor.value     = head + result.result + tail;
  editor.scrollTop = oldScrollTop
  setCaretSelection(editor, end, head.length + result.result.length)
}

function doIt() {
  var result = evalSelection()
  if (result)
    result.source.editor.focus()
}

function saveIt() { }

/* Get selection of textarea */
function getCaretSelection(field) {
    field.focus();
    var result = { start: 0, end: 0 };
    // IE support based on http://groups.drupal.org/node/1210
    if(typeof $('workspaceForm').source.selectionEnd == "undefined") {
      var range     = document.selection.createRange(),
          rangeCopy = range.duplicate()
      rangeCopy.moveToElementText(field)
      rangeCopy.setEndPoint( 'EndToEnd', range )
      result.start = rangeCopy.text.length - range.text.length
      result.end = result.start + range.text.length
    }
    else {
      result.start = field.selectionStart
      result.end   = field.selectionEnd
    }
    return result
}

/* Set selection of textarea */
function setCaretSelection(field, start, end) {
    field.focus()
    // IE
    if(typeof $('workspaceForm').source.selectionEnd == "undefined") {
      var range = field.createTextRange()
      range.expand("textedit")
      var dStart = start - (field.value.substring(0, start).split("\n").length - 1),
          dEnd   = end - field.value.length + field.value.substring(end + 1).split("\n").length - 1
      range.moveStart("character", dStart)
      range.moveEnd("character", dEnd)
      range.select()
    }
    else {
      field.selectionStart = start
      field.selectionEnd   = end
    }
}

/* Get expression from textarea */
function getSource() {
  var editor    = $('workspaceForm').source,
      selection = getCaretSelection(editor),
      start     = selection.start,
      end       = selection.end,
      text      = editor.value.substring(start, end)
  if (start == end) {
    var alltext = editor.value, index = 0
    if (start > 0 && alltext.charAt(start) == "\n")
      start--
    while (start > 0 && alltext.charAt(start) != "\n")
      start--
    if (alltext.charAt(start) == "\n")
      start++
    while (end < alltext.length && alltext.charAt(end) != "\r" && alltext.charAt(end) != "\n")
      end++
    text = alltext.substring(start, end);
    setCaretSelection(editor, start, end);
  }
  return {
    editor: editor,
    start:  start,
    end:    end,
    text:   text
  }
}

function evalSelection() {
  var source = getSource()
  try { $('workspaceForm').translation.value = translateCode(source.text) }
  catch (e) {
    if (e.errorPos != undefined) {
      var errorPos     = source.start + e.errorPos
          errorMsg     = " Parse error ->",
          oldScrollTop = $('workspaceForm').source.scrollTop
      $('workspaceForm').source.value = $('workspaceForm').source.value.substring(0, errorPos) + errorMsg +
                                        $('workspaceForm').source.value.substring(errorPos, $('workspaceForm').source.value.length)
      $('workspaceForm').source.scrollTop = oldScrollTop
      setCaretSelection($('workspaceForm').source, errorPos, errorPos + errorMsg.length)
    }
    return undefined
  }
  try {
    return {
      source: source,
      result: " " + eval($('workspaceForm').translation.value)
    }
  } catch (e) {
    alert("Oops!\n\n" + e)
    throw e
  }
}

Transcript = {
  show:  function(x) {
           $('workspaceForm').transcript.value     = $('workspaceForm').transcript.value + x + "\n"
           $('workspaceForm').transcript.scrollTop = $('workspaceForm').transcript.scrollHeight
          },
  clear: function()  {
           $('workspaceForm').transcript.value     = ""
         }
}

