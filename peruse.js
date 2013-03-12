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
      if (results.summary.errorCount > 0) {
        print('  ' + results.summary.errorCount + ' errors found.');
        print('  ' + results.summary.fixedCount + ' errors fixed.');
      } else {
        print('  OK');
      }
      errorsLength1 = results.errors.length;

      for (var i = 0; i < errorsLength1; i++) {
        if (results.errors[i] != undefined) {
          errorsLength2 = results.errors[i].length;
          for (var ii = 0; ii < errorsLength2; ii++) {
            print('    ' + results.errors[i][ii]);
          }
        }
      }

      print('');

      return results;
    }
  };
})();



/**
 * Collection of regex
 * @namespace
 */
peruse.regex = {
  property: /([.#]\w*[(;]|[@\w].*[:][\W].*[^\{$])/
};



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
    check.propertiesOrder();

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
  var propsOrder = new peruse.check.propertiesOrder();

  function addError(str, fixer) {
    var fixed = '';

    if (config.commandArgs.fix == true && typeof(fixer) == 'function') {
      config.line = fixer(config.line);
      fixed = ' (FIXED)';
      config.results.summary.fixedCount++;
    }

    if (config.results.errors[config.lineCount] == undefined) {
      config.results.errors[config.lineCount] = new Array();
    }
    config.results.errors[config.lineCount].push(
      str + ' on line ' + (config.lineCount + 1 + fixed + '.')
    );
    config.results.summary.errorCount++;
  }



  /**
   * Set local config object
   * @param {Object} args Check configuration & data.
   */
  this.setConfig = function(args) {
    setConfig(args);
    setCommentFlag();
    setNestDepth();

    function setConfig(args) {
      config = args;
      config.lineClean = config.line;
      config.lineClean = config.lineClean.replace(/[/][*].*[*][/]/g, '');
      config.lineClean = config.lineClean.replace(/[/][/].*/g, '');
    }

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
      var line = config.lineClean;
      var depthChange = 0;

      // Find open and close brace.
      var braceOpen = line.match(/{/g);
      var braceClose = line.match(/}/g);

      if (braceOpen) {
        depthChange += braceOpen.length;
        if (braceOpen.length > 1) {
          addError('Multiple opening curly braces');
        }
      }
      if (braceClose) {
        depthChange -= braceClose.length;
        if (braceClose.length > 1) {
          addError('Multiple closing curly braces');
        }
      }

      // Store new nest depth
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
    if (config.line.match(/:\S.*[^\{$]/) != null) {
      if (config.line.match(/[\^{]$/) != null) {
        addError('Colon not followed by a space', peruse.fix.colonsSpaceAfter);
      }
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

  /**
   * Checks if styling properties are properly ordered.
   */
  this.propertiesOrder = function() {
    var line = config.lineClean;
    var braceOpen = line.match(/{/g);
    var braceClose = line.match(/}/g);

    if (braceOpen && propsOrder.length() > 0) {
      propsOrder.getErrors();
      propsOrder = new peruse.check.propertiesOrder();
    }

    if (config.lineClean.match(peruse.regex.property) != null) {
      propsOrder.addProperty(config.line);
    }
  }
};



/**
 * Object for checking and fixing the style property order.
 * @constructor
 */
peruse.check.propertiesOrder = function() {
  var propsOrder = getPropsOrder();
  var props = [];
  var previousType = '';
  var typeOrder = {
    value: 0,
    reference: 1,
    style: 2
  };
  var typeErrors = [];
  var orderErrors = [];

  /**
   * Adds style properties to internal array. Properties have to be added
   * in the way they are ordered in the stylesheet.
   *
   * @param {String} property A property of a stylesheet.
   */
  this.addProperty = function(property) {
    var id = property.match(peruse.regex.property)[0];
    id = id.replace(/[:(;)].*/g, '');

    var type = 'style';
    if (id.match(/^@/)) {
      type = 'value';
    } else if (id.match(/^[.]/)) {
      type = 'reference';
    }

    checkTypeOrder(type);

    var newProp = {
      source: property,
      id: id,
      type: type
    };

    props.push(newProp);

    function checkTypeOrder(type) {
      if (typeOrder[type] < typeOrder[previousType]) {
        typeErrors.push(
          'Property "' + id + '" of type "' + type + '" cannot be ' +
          'preceded by properties of type "' + previousType + '"'
        );
      }

      previousType = type;
    }
  }

  function getPropsOrder() {

  }

  /**
   * Get all errors related to the order structure.
   * @return {Array} Array of error messages.
   */
  this.getErrors = function() {
    var orderErrors = getOrderErrors();

    return typeErrors;

    function getOrderErrors() {
      for (var i = 0; i < props.length; i++) {

      }
    }
  }

  /**
   * Get the total amount of properties that are currently stored in the object.
   * @return {Number} Total amount of properties stored.
   */
  this.length = function() {
    return props.length;
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
    MAX_DEPTH: 7,
    PROPERTIES_ORDER: [
      // Box properties
      'clear',
      'cursor',
      'display',
      'float',
      'opacity',
      'visibility',

      // Positioning
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',

      // Margin
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',

      // Border
      'outline',
      'border',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
      'border-width',
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width',
      'border-style',
      'border-top-style',
      'border-right-style',
      'border-bottom-style',
      'border-left-style',
      'border-color',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',

      // Padding
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',

      // Dimensions
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',

      // Content box behaviour
      'content',
      'list-style',
      'overflow',
      'white-space',

      // Table properties
      'table-layout',
      'caption-side',
      'border-collapse',
      'border-spacing',
      'empty-cells',

      // Text styling
      'color',
      'font',
      'font-family',
      'font-size',
      'font-weight',
      'letter-spacing',
      'line-height',
      'text-align',
      'text-indent',
      'text-transform',
      'text-decoration',
      'vertical-align',
      'word-spacing',

      // Background
      'background',
      'background-attachment',
      'background-color',
      'background-image',
      'background-repeat',
      'background-position',

      'quotes'
    ]
  };
})();
