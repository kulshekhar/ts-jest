import { TsJestGlobalOptions, TsJestConfig, BabelConfig } from './types';
import TsProgram from './ts-program';
import Memoize from './utils/memoize';
import { normalizeDiagnosticTypes } from './utils/diagnostics';
import { backportJestConfig } from './utils/backports';
import jestRootDir from './utils/jest-root-dir';
import { sep, resolve } from 'path';
import parseJsonUnsafe from './utils/parse-json-unsafe';
import * as babelCfg from './utils/babel-config';

// TODO: could be used if we need to handle the cache key ourself
// const normalizeJestConfig = (jestConfig: jest.ProjectConfig): jest.ProjectConfig => {
//   const config = { ...jestConfig, rootDir: rootDirFor(jestConfig) };
//   delete config.cacheDirectory;
//   delete config.name;
//   return config;
// };

export default class TsJestTransformer implements jest.Transformer {
  @Memoize(jestRootDir)
  babelJestFor(jestConfig: jest.ProjectConfig): jest.Transformer {
    // babel-jest is shipped with jest, no need to use the importer
    return require('babel-jest').createTransformer(
      this.babelConfigFor(jestConfig),
    );
  }

  @Memoize(jestRootDir)
  babelConfigFor(jestConfig: jest.ProjectConfig): BabelConfig | undefined {
    const config = this.configFor(jestConfig);
    const rootDir = jestRootDir(jestConfig);
    if (config.babelJest === false) {
      return;
    }

    let babelConfig!: BabelConfig;
    if (config.babelJest === true) {
      // lookup babelrc file
      babelConfig = babelCfg.extend({}, babelCfg.loadDefault(rootDir));
    } else if (typeof config.babelJest === 'string') {
      // path to a babelrc file
      let filePath = config.babelJest.replace('<rootDir>', `${rootDir}${sep}`);
      filePath = resolve(rootDir, filePath);
      babelConfig = parseJsonUnsafe(filePath);
    } else {
      // it's already an object with the config
      babelConfig = config.babelJest;
    }

    // ensure to return a freezed copy object
    return babelCfg.freeze(babelCfg.extend({}, babelConfig));
  }

  @Memoize(jestRootDir)
  configFor(jestConfig: jest.ProjectConfig): TsJestConfig {
    const parsedConfig = backportJestConfig(jestConfig);
    const { globals = {} } = parsedConfig as any;
    const options: TsJestGlobalOptions = { ...globals['ts-jest'] };
    return {
      inputOptions: options,
      babelJest: options.babelJest || false,
      diagnostics: normalizeDiagnosticTypes(options.diagnostics),
    };
  }

  @Memoize(jestRootDir)
  programFor(jestConfig: jest.ProjectConfig): TsProgram {
    const myConfig = this.configFor(jestConfig);
    return new TsProgram(jestRootDir(jestConfig), myConfig);
  }

  process(
    source: string,
    filePath: jest.Path,
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
    result = program.transpileModule(filePath, source, instrument);

    // calling babel-jest transformer
    if (config.babelJest) {
      result = this.babelJestFor(jestConfig).process(
        result,
        filePath,
        jestConfig,
        transformOptions,
      );
    }

    return result;
  }

  // TODO: use jest-config package to try to get current config and see if we are going to use babel jest or not
  // in which case we'd return `true` there:
  // get canInstrument() {}
}
