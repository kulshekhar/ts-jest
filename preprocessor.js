const tsc = require('typescript');
const getTSConfig = require('./lib/get-tsconfig');

const getTsCompilerOptions = (tsConfig) => {
  return tsc
    .convertCompilerOptionsFromJson(tsConfig.compilerOptions)
    .options;
};

module.exports = {
  process(src, path, config) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      const transpiled = tsc.transpileModule(
        src,
        {
          compilerOptions: getTsCompilerOptions(getTSConfig({ rootDir: config.rootDir })),
          fileName: path
        });

      const modified = `require('ts-jest').install({environment: 'node', emptyCacheBetweenOperations: true});${transpiled.outputText}`;

      return modified;
    }

    return src;
  }
};
