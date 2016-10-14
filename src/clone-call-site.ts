// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
// implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
import { CallSiteToString } from './call-site-toString';

export function cloneCallSite(frame) {
  var object = {};
  Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function (name) {
    object[name] = /^(?:is|get)/.test(name) ? function () { return frame[name].call(frame); } : frame[name];
  });
  object.toString = () => CallSiteToString(object);
  return object;
}