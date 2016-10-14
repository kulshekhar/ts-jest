// Except a small part of the code, all of the code here is taken from 
// https://github.com/evanw/node-source-map-support
import { wrapCallSite } from './wrap-call-site';
import { Storage } from './storage';
import { mapSourcePosition } from './map-source-position';
import { hasGlobalProcessEventEmitter } from './has-global-process-event-emitter';
import { prepareStackTrace } from './prepare-stack-trace';
import { getErrorSource } from './get-error-source';
import { shimEmitUncaughtException } from './shim-emit-uncaught-exception';
import { defaultRetrieveMapHandler } from './default-retrieve-map-handler';
import { defaultRetrieveFileHandler } from './default-retrieve-file-handler';

Storage.retrieveFileHandlers.push(defaultRetrieveFileHandler);

Storage.retrieveMapHandlers.push(defaultRetrieveMapHandler);

exports.wrapCallSite = wrapCallSite;
exports.getErrorSource = getErrorSource;
exports.mapSourcePosition = mapSourcePosition;
exports.retrieveSourceMap = Storage.retrieveSourceMap;

exports.install = function (options) {
  options = options || {};

  if (options.environment) {
    Storage.environment = options.environment;
    if (['node', 'browser', 'auto'].indexOf(Storage.environment) === -1) {
      throw new Error('environment ' + Storage.environment + ' was unknown. Available options are {auto, browser, node}');
    }
  }

  // Allow sources to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveFile) {
    if (options.overrideRetrieveFile) {
      Storage.retrieveFileHandlers.length = 0;
    }

    Storage.retrieveFileHandlers.unshift(options.retrieveFile);
  }

  // Allow source maps to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveSourceMap) {
    if (options.overrideRetrieveSourceMap) {
      Storage.retrieveMapHandlers.length = 0;
    }

    Storage.retrieveMapHandlers.unshift(options.retrieveSourceMap);
  }

  // Configure options
  if (!Storage.emptyCacheBetweenOperations) {
    Storage.emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ?
      options.emptyCacheBetweenOperations : false;
  }

  // Install the error reformatter
  if (!Storage.errorFormatterInstalled) {
    Storage.errorFormatterInstalled = true;
    Error['prepareStackTrace'] = prepareStackTrace;
  }

  if (!Storage.uncaughtShimInstalled) {
    var installHandler = 'handleUncaughtExceptions' in options ?
      options.handleUncaughtExceptions : true;

    // Provide the option to not install the uncaught exception handler. This is
    // to support other uncaught exception handlers (in test frameworks, for
    // example). If this handler is not installed and there are no other uncaught
    // exception handlers, uncaught exceptions will be caught by node's built-in
    // exception handler and the process will still be terminated. However, the
    // generated JavaScript code will be shown above the stack trace instead of
    // the original source code.
    if (installHandler && hasGlobalProcessEventEmitter()) {
      Storage.uncaughtShimInstalled = true;
      shimEmitUncaughtException();
    }
  }
};
