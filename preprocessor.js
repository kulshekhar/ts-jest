const tsc = require('typescript');

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      const transpiled = tsc.transpileModule(
        src,
        {
          compilerOptions: {
            module: tsc.ModuleKind.CommonJS,
            jsx: tsc.JsxEmit.React
          },
          fileName: path
        });

      const modified = `require('typescript-jest').install({environment: 'node', emptyCacheBetweenOperations: true});${transpiled.outputText}`;

      return modified;
    }
  }
};