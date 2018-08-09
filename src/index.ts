// tslint:disable:member-ordering
import { TsJestGlobalOptions, TsJestConfig } from './types';
import TsProgram from './ts-program.simple';
import Memoize from './memoize';
import { normalizeDiagnosticTypes } from './utils/diagnostics';

const rootDirFor = (jestConfig: jest.ProjectConfig): string => {
  return jestConfig.rootDir || process.cwd();
};

// TODO: could be used if we need to handle the cache key ourself
// const normalizeJestConfig = (jestConfig: jest.ProjectConfig): jest.ProjectConfig => {
//   const config = { ...jestConfig, rootDir: rootDirFor(jestConfig) };
//   delete config.cacheDirectory;
//   delete config.name;
//   return config;
// };

class TsJestTransformer implements jest.Transformer {
  @Memoize()
  configFor(jestConfig: jest.ProjectConfig): TsJestConfig {
    const { globals = {} } = jestConfig as any;
    const options: TsJestGlobalOptions = { ...globals['ts-jest'] };
    return {
      inputOptions: options,
      useBabelJest: !!options.useBabelJest,
      diagnostics: normalizeDiagnosticTypes(options.diagnostics),
    };
  }

  @Memoize()
  programFor(jestConfig: jest.ProjectConfig): TsProgram {
    const myConfig = this.configFor(jestConfig);
    return new TsProgram(rootDirFor(jestConfig), myConfig);
  }

  process(
    source: string,
    path: jest.Path,
    jestConfig: jest.ProjectConfig,
    transformOptions?: jest.TransformOptions,
  ): jest.TransformedSource | string {
    let result: string | jest.TransformedSource;

    // get the tranformer instance
    const program = this.programFor(jestConfig);
    const config = this.configFor(jestConfig);
    const instrument: boolean =
      !!transformOptions && transformOptions.instrument;

    // transpile TS code (source maps are included)
    result = program.transpileModule(path, source, instrument);

    // calling babel-jest transformer
    if (config.useBabelJest) {
      result = this.babelJest.process(
        result,
        path,
        jestConfig,
        transformOptions,
      );
    }

    return result;
  }

  @Memoize()
  get babelJest(): jest.Transformer {
    let babelJest = require('babel-jest');
    if (typeof babelJest.createTransformer === 'function') {
      babelJest = babelJest.createTransformer();
    }
    return babelJest;
  }

  // TODO: use jest-config package to try to get current config and see if we are going to use babel jest or not
  // in which case we'd return `true` there:
  // get canInstrument() {}
}

let transformer: jest.Transformer;
function createTransformer() {
  return (transformer = new TsJestTransformer());
}
function tsProcess(...args: any[]): any {
  return (createTransformer() as any).process(...args);
}

export { createTransformer, tsProcess as process };
