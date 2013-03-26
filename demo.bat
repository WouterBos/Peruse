@echo off

cls
ringo main.js -file=less/test-bad.less;less/test-good.less -fix=false -debug=true -prefix=pw_

pause