#!ruby
#!/usr/local/bin/ruby

# Stupidly Simple Uploader

require "cgi"

DATA_DIR = "projects" # data directory

PREVIEW = <<EOT
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head><title>Upload test</title></head>
<body> 
<form id="form" action="" method="post" enctype="multipart/form-data">
<p><input type="file" name="image"/><input type="submit"/></p>
</form>
<p>{{PREVIEW}}</p>
</body>
</html>
EOT

YUI_OUT = <<EOT
{status: 'UPLOADED', image_url: '{{URL}}'}
EOT

def main
  cgi = CGI.new
  value = cgi.params['yui_image'][0]
  if value
    template = YUI_OUT
  else
    value = cgi.params['image'][0]
    if value
      template = PREVIEW
    else 
      print "Content-type: text/html\n\n"
      print PREVIEW
      return
    end
  end

  begin
    fileName, type = upload value
  rescue => e
    output = "{status: '#{e}'}"
  else
    output = template.sub('{{PREVIEW}}', preview(fileName, type))
    output = output.sub('{{URL}}', url(fileName))
  end
  print "Content-type: text/html\n\n"
  print output
end

def url fileName
  DATA_DIR + '/' + CGI.escape(fileName)
end

# Save form data, and answer file name and type
def upload value
  if /^image\// !~ value.content_type
    raise "File type #{value.content_type} is not supported."
  end

  contents = value.read
  fileName = CGI.escape(value.original_filename)
  localName = DATA_DIR + '/' + fileName
  File.open(localName, "w") {|f| f.print contents }
  return [fileName, value.content_type]
end

def preview fileName, type
  return "type: #{type}<br/>name: #{fileName}<br/>" + 
    "<img src='#{url fileName}' alt='#{url fileName}'/>"
end

main
