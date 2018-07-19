import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as tsc from 'typescript';
import { TsJestConfig } from '../types';
import { logOnce } from './logger';
import * as _ from 'lodash';

export function getTSJestConfig(globals: jest.ConfigGlobals): TsJestConfig {
  return (globals && globals['ts-jest']) || {};
}

function formatTsDiagnostics(errors: tsc.Diagnostic[]): string {
  const defaultFormatHost: tsc.FormatDiagnosticsHost = {
    getCurrentDirectory: () => tsc.sys.getCurrentDirectory(),
    getCanonicalFileName: fileName => fileName,
    getNewLine: () => tsc.sys.newLine,
  };

  return tsc.formatDiagnostics(errors, defaultFormatHost);
}

function readCompilerOptions(
  configPath: string,
  rootDir: string,
): tsc.CompilerOptions {
  configPath = path.resolve(rootDir, configPath);
  const { config, error } = tsc.readConfigFile(configPath, tsc.sys.readFile);
  if (error) {
    throw error;
  }

  const { errors, options } = tsc.parseJsonConfigFileContent(
    config,
    tsc.sys,
    path.resolve(rootDir),
  );

  if (errors.length > 0) {
    const formattedErrors = formatTsDiagnostics(errors);
    throw new Error(
      `Some errors occurred while attempting to read from ${configPath}: ${formattedErrors}`,
    );
  }

  return options;
}

function getStartDir(): string {
  // This is needed because of the way our tests are structured.
  // If this is being executed as a library (under node_modules)
  // we want to start with the project directory that's three
  // levels above.
  // If this is being executed from the test suite, we want to start
  // in the directory of the test

  const grandparent = path.resolve(__dirname, '..', '..');
  if (grandparent.endsWith(`${path.sep}node_modules`)) {
    return process.cwd();
  }

  return '.';
}

function getPathToClosestTSConfig(
  startDir?: string,
  previousDir?: string,
): string {
  // Starting with the startDir directory and moving on to the
  // parent directory recursively (going no further than the root directory)
  // find and return the path to the first encountered tsconfig.json file

  if (!startDir) {
    return getPathToClosestTSConfig(getStartDir());
  }

  const tsConfigPath = path.join(startDir, 'tsconfig.json');

  const startDirPath = path.resolve(startDir);
  const previousDirPath = path.resolve(previousDir || '/');

  if (startDirPath === previousDirPath || fs.existsSync(tsConfigPath)) {
    return tsConfigPath;
  }

  return getPathToClosestTSConfig(path.join(startDir, '..'), startDir);
}

function getTSConfigPathFromConfig(
  globals: jest.ConfigGlobals,
  rootDir?: string,
): string {
  const defaultTSConfigFile = getPathToClosestTSConfig(rootDir);
  if (!globals) {
    return defaultTSConfigFile;
  }

  const tsJestConfig = getTSJestConfig(globals);

  if (tsJestConfig.tsConfigFile) {
    return tsJestConfig.tsConfigFile;
  }

  return defaultTSConfigFile;
}

export function mockGlobalTSConfigSchema(
  globals: jest.ConfigGlobals,
): jest.ConfigGlobals {
  const configPath = getTSConfigPathFromConfig(globals);
  return { 'ts-jest': { tsConfigFile: configPath } };
}

export const getTSConfig = _.memoize(getTSConfig_local, (globals, rootDir) => {
  // check cache before resolving configuration
  // NB: We use JSON.stringify() to create a consistent, unique signature. Although it lacks a uniform
  //     shape, this is simpler and faster than using the crypto package to generate a hash signature.
  return `${rootDir}:${JSON.stringify(globals)}`;
});

// Non-memoized version of TSConfig
function getTSConfig_local(globals, rootDir: string = '') {
  const configPath = getTSConfigPathFromConfig(globals, rootDir);
  logOnce(`Reading tsconfig file from path ${configPath}`);

  const config = readCompilerOptions(configPath, rootDir);
  logOnce('Original typescript config before modifications: ', { ...config });

  // tsc should not emit declaration map when used for tests
  // disable some options that might break jest
  config.declaration = false;
  config.declarationMap = false;
  config.emitDeclarationOnly = false;

  // ts-jest will map lines numbers properly if inlineSourceMap and
  // inlineSources are set to true. The sourceMap configuration
  // is used to send the sourcemap back to Jest
  delete config.sourceMap;
  config.inlineSourceMap = true;
  config.inlineSources = true;

  // the coverage report is broken if `.outDir` is set
  // see https://github.com/kulshekhar/ts-jest/issues/201
  // `.outDir` is removed even for test files as it affects with breakpoints
  // see https://github.com/kulshekhar/ts-jest/issues/309
  delete config.outDir;

  if (configPath === path.join(getStartDir(), 'tsconfig.json')) {
    // hardcode module to 'commonjs' in case the config is being loaded
    // from the default tsconfig file. This is to ensure that coverage
    // works well. If there's a need to override, it can be done using
    // a custom tsconfig for testing
    config.module = tsc.ModuleKind.CommonJS;
  }

  config.module = config.module || tsc.ModuleKind.CommonJS;
  config.jsx = config.jsx || tsc.JsxEmit.React;

  return config;
}

export function cacheFile(
  jestConfig: jest.ProjectConfig,
  filePath: string,
  src: string,
): void {
  // store transpiled code contains source map into cache, except test cases
  if (!jestConfig.testRegex || !filePath.match(jestConfig.testRegex)) {
    const outputFilePath = path.join(
      jestConfig.cacheDirectory,
      '/ts-jest/',
      crypto
        .createHash('md5')
        .update(filePath)
        .digest('hex'),
    );

    fsExtra.outputFileSync(outputFilePath, src);
  }
}

export function runTsDiagnostics(
  filePath: string,
  compilerOptions: tsc.CompilerOptions,
): void {
  const program = tsc.createProgram([filePath], compilerOptions);
  const allDiagnostics = tsc.getPreEmitDiagnostics(program);

  if (allDiagnostics.length) {
    throw new Error(formatTsDiagnostics(allDiagnostics));
  }
}
