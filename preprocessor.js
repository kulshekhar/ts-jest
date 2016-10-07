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

      return transpiled.outputText;
    }

    return src;
  }
};