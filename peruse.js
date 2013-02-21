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
     * @param  {String} code The Less code as string.
     * @param  {String} fileName The name of the file.
     * @param  {Object} commandArgs Config object.
     * @return {Object} Test results.
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

      return results;
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
  var results = {
    summary: {
      lineCount: 0,
      errorCount: 0,
      fixedCount: 0
    },
    errors: new Array(),
    codeFixed: code
  };
  var code = code.split(/\n/);
  var commandArgs = arg_commandArgs;
  var check = new peruse.check();

  function checkLine(line, lineCount) {
    check.setConfig({
      line: line,
      lineCount: lineCount,
      results: results,
      commandArgs: commandArgs
    });
    if (lineCount == 0) {
      check.documentComment();
    }
    check.nestDepth();
    check.colons();
    check.tabs();
    check.multilineComments();
    results.errors = check.getErrors();
    code[lineCount] = check.getCode();
  }

  /**
   * Starts code checking.
   * @return {object} Test results.
   */
  this.run = function() {
    results.summary.lineCount = code.length;
    results.summary.errorCount = 0;

    for (var i = 0; i < results.summary.lineCount; i++) {
      checkLine(code[i], i);
    }
    results.codeFixed = code.join('\n');

    return results;
  }
};



/**
 * Collection of helper functions to check some functionality.
 *
 * @constructor
 */
peruse.check = function() {
  var config;
  var state = {
    isComment: false,
    nestDepth: 0
  };

  function addError(str, fixer) {
    if (config.results.errors[config.lineCount] == undefined) {
      config.results.errors[config.lineCount] = new Array();
    }
    config.results.errors[config.lineCount].push(
      str + ' on line ' + (config.lineCount + 1)
    );
    config.results.summary.errorCount++;

    if (config.commandArgs.fix == true && typeof(fixer) == 'function') {
      config.line = fixer(config.line);
      print('FIXED');
      config.results.summary.fixedCount++;
    }
  }



  /**
   * Set local config object
   * @param {Object} args Check configuration & data.
   */
  this.setConfig = function(args) {
    config = args;
    setCommentFlag();
    setNestDepth();

    function setCommentFlag() {
      if (state.isComment == false) {
        var commentStart = config.line.match(/[/][*].*/);
        if (commentStart && commentStart[0].indexOf('*/') == -1) {
          state.isComment = true;
        }
      } else {
        var commentEnd = config.line.match(/[*][/].*/);
        if (commentEnd) {
          state.isComment = false;
        }
      }
    }

    function setNestDepth() {
      var line = config.line;
      var depthChange = 0;

      // Strip comments
      line = line.replace(/[/][*].*|[/][/].*/g, '');
      var braceOpen = line.match(/{/);
      var braceClose = line.match(/}/);
      if (braceOpen) {
        depthChange += braceOpen.length;
      }
      if (braceClose) {
        depthChange -= braceClose.length;
      }
      state.nestDepth += depthChange;
    }
  }

  /**
   * Get violations total.
   * @return {Number} Violations total.
   */
  this.getErrors = function() {
    return config.results.errors;
  }

  /**
   * Get the line of code from the config object.
   * @return {String} The line of code from the config object.
   */
  this.getCode = function() {
    return config.line;
  }

  /**
   * Document should start with a multiline comment explaining the purpose
   * of the file.
   */
  this.documentComment = function() {
    if (config.lineCount == 0) {
      var hasDocumentComment = config.line.match(/[/][*]/);
      var firstChar = config.line.match(/^[/][*]/);
      var firstCharError = 'First character is not the start of a ' +
                           'multiline comment';
      if (hasDocumentComment == null) {
        addError('No document comment');
      }
      if (firstChar == null) {
        if (hasDocumentComment == null) {
          addError(firstCharError);
        } else {
          addError(firstCharError, peruse.fix.documentComment);
        }
      }
    }
  }

  /**
   * Checks comments that start with "/*"
   */
  this.multilineComments = function() {
    if (state.isComment) return;

    checkMaxLength();
    onlyComment();

    function checkMaxLength() {
      var maxLen = peruse.rules.MAX_LINE_LENGTH;
      if (config.line.length > maxLen) {
        addError('Comment longer than ' + maxLen + ' characters');
      }
    }
    function onlyComment() {
      var multilineCommentAfterCode = config.line.match(/[\w].*[/][*]/);
      if (multilineCommentAfterCode != null &&
          multilineCommentAfterCode[0].match(/[*][/]/) == null) {
        addError('Multiline comment appended after code');
      }
    }
  }

  /**
   * There should not be a white-space before a colon
   */
  this.colons = function() {
    if (state.isComment) return;

    if (config.line.match(/[\s]+?:/) != null) {
      addError('Space before colon', peruse.fix.colonsSpaceBefore);
    }
    if (config.line.match(/:\S/) != null) {
      addError('Colon not followed by a space', peruse.fix.colonsSpaceAfter);
    }
  }

  /**
   * Make sure mixins are not getting too hiarchical and complex which results
   * in very long and inefficient selectors.
   */
  this.nestDepth = function() {
    if (state.isComment) return;

    if (state.nestDepth > peruse.rules.MAX_DEPTH) {
      addError('Styling too deeply nested');
    }
  }

  /**
   * Document should not contain any tabs.
   */
  this.tabs = function() {
    if (config.line.match(/\t/) != null) {
      addError('Tabs used', peruse.fix.tabs);
    }
  }
};



/**
 * Collection of helper functions to fix some code conventions violations.
 *
 * @namespace
 */
peruse.fix = (function() {
  return {
    /**
     * Add space after colon.
     */
    colonsSpaceAfter: function(line) {
      return line.replace(/:/g, ': ');
    },

    /**
     * Remove characters before document comment so that it starts with
     * the first character.
     */
    documentComment: function(line) {
      return line.replace(/.+?[/][*]/g, '/*');
    },

    /**
     * Removes space before colon.
     */
    colonsSpaceBefore: function(line) {
      return line.replace(/[\s]+?:/g, ':');
    },

    /**
     * Changes tabs into spaces.
     */
    tabs: function(line) {
      return line.replace(/\t/g, '    ');
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
    MAX_LINE_LENGTH: 100,
    MAX_DEPTH: 7
  };
})();
