import { TsJestGlobalOptions, TsJestConfig, BabelConfig } from './types';
import TsProgram from './ts-program';
import Memoize from './utils/memoize';
import { normalizeDiagnosticTypes } from './utils/diagnostics';
import { backportJestConfig } from './utils/backports';
import jestRootDir from './utils/jest-root-dir';
import { sep, resolve } from 'path';
import parseJsonUnsafe from './utils/parse-json-unsafe';
import * as babelCfg from './utils/babel-config';
import closestPatckageJson from './utils/closest-package-json';
import sha1 from './utils/sha1';

export default class TsJestTransformer implements jest.Transformer {
  @Memoize(jestRootDir)
  sanitizedJestConfigFor<T extends jest.ProjectConfig | jest.InitialOptions>(
    jestConfig: T,
  ): T {
    const config = {
      ...(jestConfig as object),
      rootDir: jestRootDir(jestConfig),
    } as T;
    delete config.cacheDirectory;
    delete config.name;
    return config;
  }

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

  // we can cache as for same instance the cache key won't change as soon as the path/content pair
  // doesn't change
  // TODO: find out if jest is already using this cache strategy and remove it if so
  @Memoize((data: string, path: string) => `${path}::${data}`)
  getCacheKey(
    fileContent: string,
    filePath: string,
    jestConfigStr: string,
    {
      instrument = false,
      rootDir,
    }: { instrument?: boolean; rootDir?: string } = {},
  ): string {
    const CHAR0 = '\0';
    // will be used as the hashing data source
    const hashData: string[] = [];
    const hashUpdate = (data: string) => hashData.push(data, CHAR0);

    // add file path and its content
    hashUpdate(filePath);
    hashUpdate(fileContent);

    // saniize and normalize jest config
    const jestConfig: jest.ProjectConfig = JSON.parse(jestConfigStr);
    jestConfig.rootDir = rootDir = jestRootDir({
      rootDir: rootDir || jestConfig.rootDir,
    });
    const sanitizedJestConfig: jest.ProjectConfig = this.sanitizedJestConfigFor(
      jestConfig,
    );
    // add jest config
    hashUpdate(JSON.stringify(sanitizedJestConfig));
    // add project's package.json
    const projectPkg = closestPatckageJson(rootDir, true);
    hashUpdate(projectPkg);
    // add babel config if using babel jest
    const babelConfig = this.babelConfigFor(jestConfig) || {};
    hashUpdate(JSON.stringify(babelConfig));
    // add tsconfig
    const tsConfig = this.programFor(sanitizedJestConfig).parsedConfig;
    hashUpdate(JSON.stringify(tsConfig));
    // add instrument, even if we don't use it since `canInstrument` is false
    hashUpdate(`instrument:${instrument ? 'on' : 'off'}`);

    return sha1(...hashData);
  }

  // TODO: use jest-config package to try to get current config and see if we are going to use babel jest or not
  // in which case we'd return `true` there:
  // get canInstrument() {}
}
