

/*
 yuiImgUploader
 variables: 
  rte: The YAHOO.widget.Editor instance
  upload_url: the url to post the file to
  upload_image_name: the name of the post parameter to send the file as
  
 Your server must handle the posted image.  You must return a JSON object
 with the result url that the image can be viewed at on your server.  If 
 the upload fails, you can return an error message.  For successful
 uploads, the status must be set to UPLOADED.  All other status messages,
 or the lack of a status message is interpreted as an error.  IE will 
 try to open a new document window when the response is returned if your
 content-type header on your response is not set to 'text/javascript'
 
 Example Success:
 {status:'UPLOADED', image_url:'/somedirectory/filename'}
 Example Failure:
 {status:'We only allow JPEG Images.'}

*/
function yuiImgUploader(rte, upload_url, upload_image_name) {
	// customize the editor img button 
	
	YAHOO.log( "Adding Click Listener" ,'debug');
	rte.addListener('toolbarLoaded',function() {
		rte.toolbar.addListener ( 'insertimageClick', function(o) {
			try {
				var imgPanel=new YAHOO.util.Element('yui-editor-panel');
				imgPanel.on ( 'contentReady', function() {
					try {
						var Dom=YAHOO.util.Dom;
						var label=document.createElement('label');
						label.innerHTML='<strong>Upload:</strong>'+
							'<input type="file" id="insertimage_upload" name="'+upload_image_name+
							'" size="10" style="width: 20%" />'+
							'<a href="#"  id="insertimage_upload_btn" style="width: 20%; margin-left: 10em;">Upload Image</a>'+
							'</label>'; 
					
						var img_elem=Dom.get('insertimage_url');
						Dom.getAncestorByTagName(img_elem, 'form').encoding = 'multipart/form-data';
						
						Dom.insertAfter(
							label,
							img_elem.parentNode);
							
						YAHOO.util.Event.on ( 'insertimage_upload_btn', 'click', function(ev) {
// 							//alert ( "Upload Click" );
							YAHOO.util.Event.stopEvent(ev); // no default click action
							YAHOO.util.Connect.setForm ( img_elem.form, true, true );
							var c=YAHOO.util.Connect.asyncRequest(
							'POST', upload_url, {
								upload:function(r){
									try {
										// strip pre tags if they got added somehow
										resp=r.responseText.replace( /<pre>/i, '').replace ( /<\/pre>/i, '');
										var o=eval('('+resp+')');
										if (o.status=='UPLOADED') {
											Dom.get('insertimage_upload').value='';
											Dom.get('insertimage_url').value=o.image_url;
											// tell the image panel the url changed
											// hack instead of fireEvent('blur')
											// which for some reason isn't working
											Dom.get('insertimage_url').focus();
											Dom.get('insertimage_upload').focus();
										} else {
										alert ( "Upload Failed: "+o.status );
									}
									
									} catch ( eee ) {
										YAHOO.log( eee.message, 'error' )
									}
								}
							}
							);
							return false;
						});
						
					} catch ( ee ) { YAHOO.log( ee.message, 'error' ) }
				});
			} catch ( e ) {
				YAHOO.log( e.message, 'error' )
			}
		});
	});
	
}
