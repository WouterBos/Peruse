@echo off

cls
::ringo main.js -file=Less/test-bad.less;Less/test-good.less -fix=true -debug=true
ringo main.js -file=Less/test.less -fix=true -debug=true -prefix=pw_

pause