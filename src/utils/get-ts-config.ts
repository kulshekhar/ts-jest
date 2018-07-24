import { TSCONFIG_FILENAME } from './constants';
import {
  CompilerOptions,
  readConfigFile,
  sys,
  parseJsonConfigFileContent,
  ModuleKind,
  JsxEmit,
} from 'typescript';
import { resolve, sep } from 'path';
import formatTsDiagnostics from './format-diagnostics';
import closestFileData, { IClosestDataResult } from 'closest-file-data';
import { memoize } from 'lodash';
import { logOnce } from './logger';
import getTSJestConfig from './get-ts-jest-config';

const getTSConfig = memoize(getTSConfig_local, jestConfig => {
  // check cache before resolving configuration
  // NB: We use JSON.stringify() to create a consistent, unique signature. Although it lacks a uniform
  //     shape, this is simpler and faster than using the crypto package to generate a hash signature.
  return JSON.stringify(jestConfig);
});
export default getTSConfig;

// Non-memoized version of TSConfig
function getTSConfig_local(jestConfig: jest.ProjectConfig): CompilerOptions {
  const configMeta = findTSConfigPath(jestConfig);
  if (!configMeta) {
    throw new ReferenceError(
      `[ts-jest] Unable to find TS configuration file given current configuration`,
    );
  }
  const { path: configPath } = configMeta;
  logOnce(`Reading tsconfig file from path ${configPath}`);

  const config = readCompilerOptions(configPath, jestConfig.rootDir);
  logOnce('Original typescript config before modifications: ', { ...config });

  // tsc should not emit declaration map when used for tests
  // disable some options that might break jest
  config.declaration = false;
  config.declarationMap = false;
  config.emitDeclarationOnly = false;

  // ts-jest will map lines numbers properly if inlineSourceMap and
  // inlineSources are set to true. The sourceMap configuration
  // is used to send the sourcemap back to Jest
  config.inlineSourceMap = false;
  config.sourceMap = true;
  config.inlineSources = true;

  // the coverage report is broken if `.outDir` is set
  // see https://github.com/kulshekhar/ts-jest/issues/201
  // `.outDir` is removed even for test files as it affects with breakpoints
  // see https://github.com/kulshekhar/ts-jest/issues/309
  delete config.outDir;
  delete config.outFile;

  if (!configMeta.isUserDefined) {
    // hardcode module to 'commonjs' in case the config is being loaded
    // from the default tsconfig file. This is to ensure that coverage
    // works well. If there's a need to override, it can be done using
    // a custom tsconfig for testing
    config.module = ModuleKind.CommonJS;
  }

  config.module = config.module || ModuleKind.CommonJS;
  config.jsx = config.jsx || JsxEmit.React;

  return config;
}

function readCompilerOptions(
  configPath: string,
  rootDir: string,
): CompilerOptions {
  configPath = resolve(rootDir, configPath);
  const { config, error } = readConfigFile(configPath, sys.readFile);
  if (error) {
    throw error;
  }

  const { errors, options } = parseJsonConfigFileContent(
    config,
    sys,
    resolve(rootDir),
  );

  if (errors.length > 0) {
    const formattedErrors = formatTsDiagnostics(errors);
    throw new Error(
      `Some errors occurred while attempting to read from ${configPath}: ${formattedErrors}`,
    );
  }

  return options;
}

// function getStartDir(jestConfig: jest.ProjectConfig): string {
//   // This is needed because of the way our tests are structured.
//   // If this is being executed as a library (under node_modules)
//   // we want to start with the project directory that's three
//   // levels above.
//   // If this is being executed from the test suite, we want to start
//   // in the directory of the test

//   // TODO: shouldn't we use the path of jest config here instead of '.' ?
//   // return process.env.__RUNNING_TS_JEST_TESTS ? process.cwd() : '.';
//   return process.env.__RUNNING_TS_JEST_TESTS ? process.cwd() : (jestConfig.rootDir || process.cwd());
// }

// we don't need any data, just its full path
const tsConfigReader = { basename: TSCONFIG_FILENAME, read: () => 0 };

function findTSConfigPath(
  jestConfig: jest.ProjectConfig,
): { isUserDefined?: boolean; path: string } | void {
  let tsConfigFile = getTSJestConfig(jestConfig).tsConfigFile;
  if (tsConfigFile) {
    tsConfigFile = tsConfigFile.replace(
      '<rootDir>',
      `${jestConfig.rootDir}${sep}`,
    );
    tsConfigFile = resolve(jestConfig.rootDir, tsConfigFile);
    return { path: tsConfigFile, isUserDefined: true };
  }

  return closestFileData(jestConfig.rootDir, tsConfigReader);
}
