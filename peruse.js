/**
 * Object for checking Less code for PAT's code convention.
 * @namespace
 */
var peruse = (function() {
  return {
    /**
     * Checks the Less code
     *
     * @memberOf peruse
     * @param  {string} code       The Less code as string.
     * @param  {Object} commandArgs Config object.
     */
    checkCode: function(code, fileName, commandArgs) {
      var checker = new peruse.checker(code, commandArgs);
      var errorsLength1;
      var errorsLength2;
      var results = checker.run();

      print('Checking ' + fileName);
      print('  ' + results.summary.errorCount + ' errors found.');
      errorsLength1 = results.errors.length;

      for (var i = 0; i < errorsLength1; i++) {
        if (results.errors[i] != undefined) {
          errorsLength2 = results.errors[i].length;
          for (var ii = 0; ii < errorsLength2; ii++) {
            print('  ' + results.errors[i][ii]);
          }
        }
      }

      print('');
    }
  };
})();



/**
 * Performs the actual checking
 * @constructor
 *
 * @param  {string} code The code to be checked.
 * @param  {object} arg_commandArgs Config object.
 */
peruse.checker = function(code, arg_commandArgs) {
  var code = code.split(/\n/);
  var results = {
    summary: {},
    errors: new Array()
  };
  var commandArgs = arg_commandArgs;

  function checkLine(line, lineCount) {
    var config = {
      line: line,
      lineCount: lineCount,
      results: results,
      commandArgs: commandArgs
    };

    peruse.check.setConfig(config);
    peruse.check.tabs();
    peruse.check.multilineComments();
    results.errors = peruse.check.getErrors();
    code[lineCount] = peruse.check.getCode();
  }

  /**
   * Starts code checking.
   * @return {object} Object with test results.
   */
  this.run = function() {
    results.summary = {
      lineCount: code.length,
      errorCount: 0
    };

    for (var i = 0; i < results.summary.lineCount; i++) {
      checkLine(code[i], i);
    }

    return results;
  }
};



/**
 * Collection of helper functions to check some functionality.
 *
 * @namespace
 * @return {object} Empty object.
 */
peruse.check = (function() {
  var config;
  var state = {
    isComment: false
  };

  function addError(str, fixer) {
    if (config.results.errors[config.lineCount] == undefined) {
      config.results.errors[config.lineCount] = new Array();
    }
    config.results.errors[config.lineCount].push(
      str + ' on line ' + config.lineCount
    );
    config.results.summary.errorCount++;

    if (config.commandArgs.fix == true && typeof(fixer) == 'function') {
      config.line = fixer(config.line);
    }
  }



  return {
    setConfig: function(args) {
      config = args;
      setCommentFlag();

      function setCommentFlag() {
        var reg = config.line.match(/[/][*].*/);
        if (reg[0].indexOf('*/') == -1) {
          config.isComment = true;
        }
      }
    },

    getErrors: function() {
      return config.results.errors;
    },

    getCode: function() {
      return config.line;
    },

    /**
     * Checks comments that start with "/*"
     */
    multilineComments: function() {
      if (state.isComment == false) {
        return false;
      }

      checkMaxLength();
      onlyComment();

      function checkMaxLength() {
        var maxLen = peruse.rules.MAX_LINE_LENGTH;
        if (config.line.length > maxLen) {
          addError('Comment longer than ' + maxLen + ' characters');
        }
      }
      function onlyComment() {
        if (config.line.match(/[\w].*[/][*]/) != null) {
          addError('Multiline comment should not contain any preceding code.');
        }
      }
    }

    /**
     * Document should not contain any tabs.
     */
    tabs: function() {
      if (config.line.match(/\t/) != null) {
        addError('Tabs used', peruse.fix.tabs);
      }
    }
  };
})();



/**
 * Collection of helper functions to fix some code conventions violations.
 *
 * @namespace
 */
peruse.fix = (function() {
  return {
    tabs: function(line) {
      return line.replace(/\t/, '....');
    }
  };
})();



/**
 * Code convention rules are stored here
 *
 * @namespace
 */
peruse.rules = (function() {
  return {
    MAX_LINE_LENGTH: function() {
      return 120;
    }
  };
})();
