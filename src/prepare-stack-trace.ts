// This function is part of the V8 stack trace API, for more info see:
// http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
import { Storage } from './storage';
import { wrapCallSite } from './wrap-call-site';

export function prepareStackTrace(error, stack) {
  if (Storage.emptyCacheBetweenOperations) {
    Storage.fileContentsCache = {};
    Storage.sourceMapCache = {};
  }

  return error + stack.map(function (frame) {
    return '\n    at ' + wrapCallSite(frame);
  }).join('');
}