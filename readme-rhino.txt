To use OMeta under Rhino:

Monad:~/prog/ometa-js awarth$ java org.mozilla.javascript.tools.shell.Main                
Rhino 1.7 release 1 2008 03 06
js> load("ometa-rhino.js")
js> ometa("ometa M { ones = 1* }")
[object Object]
js> M.matchAll([1, 1, 1, 1, 1], "ones")
[1, 1, 1, 1, 1]

