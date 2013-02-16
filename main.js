#!/usr/bin/env ringo

var actions = require("./actions");
var response = require("ringo/jsgi/response");
load('artisan.js');

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
		getBool(system.args[i], 'fix');
		getBool(system.args[i], 'debug');
	}
	
	// Check each file
	var fileNameLength = args.fileName.length;
	for (var i = 0; i < fileNameLength; i++) {
		artisan.checkCode(
			fs.open(args.fileName[i]).read(),
			args.fileName[i],
			args
		);
	}
	
	function getBool(str, flag) {
		if (str.indexOf('-' + flag + '=') > -1) {
			if (str.replace('-' + flag + '=', '') == 'true') {
				args[flag] = true;
			}
		}
	}
}



// main script to start application
if (require.main == module) {
    main();
}



/*// Minimalistic request dispatcher in lieu of a proper framework
exports.app = function(request) {
    var path = request.pathInfo.slice(1) || "index";
    // 1. resolve against actions
    if (typeof actions[path] === "function") {
        return actions[path](request);
    }
    // 2. resolve against public folder
    var resource = getResource("./public/" + path);
    if (resource.exists()) {
        return response.static(resource);
    }
    // 3. return 404 response
    return response.notFound(request.pathInfo);
}*/
