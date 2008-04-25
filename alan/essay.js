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
    { group: 'file', label: 'File',
        buttons: [
            { type: 'push', label: 'Save CTRL + S', value: 'save'},
            { type: 'push', label: 'Do It CTRL + D', value: 'doit' }
        ]
    }

]
}

var myEditor = new YAHOO.widget.SimpleEditor('source', {
  width: '100%',
  height: '500px',
  dompath: false, //Turns on the bar at the bottom
  //  autoHeight: true,
  toolbar: toolbar
});
myEditor.render();

myEditor.on("toolbarLoaded", function() {
    myEditor.toolbar.on("saveClick", save);
    myEditor.toolbar.on("doitClick", function(ev) { console.log(myEditor._getSelection().toString()) });
  loadProject();
});

function save() {
  writeFile("essay", myEditor.getEditorHTML())
}

