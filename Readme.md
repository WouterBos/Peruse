About Peruse
============

Checks Less CSS files wether they comply with the PAT code convention (https://gist.github.com/WouterBos/4772202)



Platforms
=========

Any Windows installation with Java.
It should also work on all major platforms as long as Java is installed, but that isn't tested.



Development state
=================

Peruse is still in its early development. It checks some things like nest depth and comment style, but the best has yet to come. You're help is more than welcome!


How to use it
=============

Peruse is run from command prompt with Ringo. This is how you run Peruse:

In case of multiple files:
ringo main.js -file=Less/test-bad.less;Less/test-good.less

In case of a single file
ringo main.js -file=Less/test.less


Directory structure
===================

|-- config   RingoJS folder.
|-- less     Some Less files to test Peruse.
main.js      The runner. RingoJS has to run this file to get Peruse started.
peruse.js    The Peruse library.
run.bat      Windows batch file. Runs some tests on the files in the "less" folder.