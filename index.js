// Avoid require()'ing the preprocessor when index.js gets loaded as part
// of the transpiled test file output, to avoid tripping this bug in
// babel-core: https://github.com/babel/babel/pull/6524 which is to be
// fixed in babel-core 7.0.
// Related ts-jest issue: https://github.com/kulshekhar/ts-jest/issues/367
function lazyRequire(fnName) {
  return function() {
    return require('./dist/preprocessor')[fnName].apply(null, arguments);
  };
}

module.exports = {
  process: lazyRequire('process'),
  getCacheKey: lazyRequire('getCacheKey'),
  install: require('./dist/install').install,
};
