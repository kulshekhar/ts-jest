const tsc = require('typescript');

module.exports = {
  process(src, path, config) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      const transpiled = tsc.transpileModule(
        src,
        {
          compilerOptions: getTSConfig(config.globals),
          fileName: path
        });

      const modified = `require('ts-jest').install({environment: 'node', emptyCacheBetweenOperations: true});${transpiled.outputText}`;

      return modified;
    }

    return src;
  }
};

function getTSConfig(globals) {
  const config = globals.__TS_CONFIG__ || {};
  config.module = config.module || tsc.ModuleKind.CommonJS;
  config.jsx = config.jsx || tsc.JsxEmit.React;
  
  return config;
}