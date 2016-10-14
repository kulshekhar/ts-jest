// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
// implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
export function CallSiteToString(self) {
  var fileName;
  var fileLocation = '';
  if (self.isNative()) {
    fileLocation = 'native';
  } else {
    fileName = self.getScriptNameOrSourceURL();
    if (!fileName && self.isEval()) {
      fileLocation = self.getEvalOrigin();
      fileLocation += ', ';  // Expecting source position to follow.
    }

    if (fileName) {
      fileLocation += fileName;
    } else {
      // Source code does not originate from a file and is not native, but we
      // can still get the source position inside the source string, e.g. in
      // an eval string.
      fileLocation += '<anonymous>';
    }
    var lineNumber = self.getLineNumber();
    if (lineNumber != null) {
      fileLocation += ':' + lineNumber;
      var columnNumber = self.getColumnNumber();
      if (columnNumber) {
        fileLocation += ':' + columnNumber;
      }
    }
  }

  var line = '';
  var functionName = self.getFunctionName();
  var addSuffix = self;
  var isConstructor = self.isConstructor();
  var isMethodCall = !(self.isToplevel() || isConstructor);
  if (isMethodCall) {
    var typeName = self.getTypeName();
    var methodName = self.getMethodName();
    if (functionName) {
      if (typeName && functionName.indexOf(typeName) !== 0) {
        line += typeName + '.';
      }
      line += functionName;
      if (methodName && functionName.indexOf('.' + methodName) !== functionName.length - methodName.length - 1) {
        line += ' [as ' + methodName + ']';
      }
    } else {
      line += typeName + '.' + (methodName || '<anonymous>');
    }
  } else if (isConstructor) {
    line += 'new ' + (functionName || '<anonymous>');
  } else if (functionName) {
    line += functionName;
  } else {
    line += fileLocation;
    addSuffix = false;
  }
  if (addSuffix) {
    line += ' (' + fileLocation + ')';
  }
  return line;
}