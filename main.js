#!/usr/bin/env ringo

load('peruse.js');

function main(args) {
  var fs = require('fs');
  var system = require('system');
  var args = {
    debug: false,
    fix: false,
    fileName: ''
  };
  var source;

  // Get command arguments
  for (var i = 0; i < system.args.length; i++) {
    // Get file names
    if (system.args[i].indexOf('-file=') > -1) {
      args.fileName = system.args[i].replace('-file=', '');
      if (args.fileName.indexOf(';') > -1) {
        args.fileName = [args.fileName];
      } else {
        args.fileName = args.fileName.split(';');
      }
    }

    // Get boolean flags
    getArg(system.args[i], 'fix');
    getArg(system.args[i], 'debug');
    getArg(system.args[i], 'prefix');
    getArg(system.args[i], 'nestedPrefix');
  }

  // Check each file
  var fileNameLength = args.fileName.length;
  for (var i = 0; i < fileNameLength; i++) {
    var code = fs.open(args.fileName[i]).read();
    var results = peruse.checkCode(
      code,
      args.fileName[i],
      args
    );

    // Save fixes
    if (results.codeFixed != code) {
      fs.write(args.fileName[i] + '.bak', code);
      fs.write(args.fileName[i], results.codeFixed);
    }

  }

  function getArg(str, flag) {
    if (str.indexOf('-' + flag + '=') > -1) {
      var value = str.replace('-' + flag + '=', '');
      if (value == 'true') {
        args[flag] = true;
      } else {
        args[flag] = true;
      }
    }
  }
}



// main script to start application
if (require.main == module) {
  main();
}
