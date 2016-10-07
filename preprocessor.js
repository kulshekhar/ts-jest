const tsc = require('typescript');
const {getTSConfig} = require('./utils');

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