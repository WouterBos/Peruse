ABANDONED PROJECT
=================


About Peruse
============

Checks Less CSS files whether they comply with the [PAT code convention](https://gist.github.com/WouterBos/4772202).



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

Check a single file:  
`ringo main.js -file=Less/test.less`

Check multiple files:  
`ringo main.js -file=Less/test-bad.less;Less/test-good.less`

Automatically fix error: (USE AT YOUR OWN RISK)  
`ringo main.js -file=Less/test.less`


Directory structure
===================

	|-- config     RingoJS folder.
	|-- less       Some Less files to test Peruse.
	main.js        The runner. RingoJS has to run this file to get Peruse started.
	peruse.js      The Peruse library.
	demo.bat       Windows batch file. It does a test on a 'bad' and a 'good' Less file.
	test-dev.bat   Windows batch file used during development.
