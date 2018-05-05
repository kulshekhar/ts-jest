import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as tsc from 'typescript';
import { ConfigGlobals, JestConfig, TsJestConfig } from './jest-types';
import { logOnce } from './logger';
import * as _ from 'lodash';

export function getTSJestConfig(globals: ConfigGlobals): TsJestConfig {
  return globals && globals['ts-jest'] ? globals['ts-jest'] : {};
}

function formatTscParserErrors(errors: tsc.Diagnostic[]) {
  return errors.map(s => JSON.stringify(s, null, 4)).join('\n');
}

function readCompilerOptions(configPath: string, rootDir: string) {
  configPath = path.resolve(rootDir, configPath);

  // First step: Let tsc pick up the config.
  const loaded = tsc.readConfigFile(configPath, file => {
    const read = tsc.sys.readFile(file);
    // See
    // https://github.com/Microsoft/TypeScript/blob/a757e8428410c2196886776785c16f8f0c2a62d9/src/compiler/sys.ts#L203 :
    // `readFile` returns `undefined` in case the file does not exist!
    if (!read) {
      throw new Error(
        `ENOENT: no such file or directory, open '${configPath}'`,
      );
    }
    return read;
  });
  // In case of an error, we cannot go further - the config is malformed.
  if (loaded.error) {
    throw new Error(JSON.stringify(loaded.error, null, 4));
  }

  // Second step: Parse the config, resolving all potential references.
  const basePath = path.dirname(configPath); // equal to "getDirectoryPath" from ts, at least in our case.
  const parsedConfig = tsc.parseJsonConfigFileContent(
    loaded.config,
    tsc.sys,
    basePath,
  );
  // In case the config is present, it already contains possibly merged entries from following the
  // 'extends' entry, thus it is not required to follow it manually.
  // This procedure does NOT throw, but generates a list of errors that can/should be evaluated.
  if (parsedConfig.errors.length > 0) {
    const formattedErrors = formatTscParserErrors(parsedConfig.errors);
    throw new Error(
      `Some errors occurred while attempting to read from ${configPath}: ${formattedErrors}`,
    );
  }
  return parsedConfig.options;
}

function getStartDir(): string {
  // This is needed because of the way our tests are structured.
  // If this is being executed as a library (under node_modules)
  // we want to start with the project directory that's three
  // levels above.
  // If t his is being executed from the test suite, we want to start
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

function getTSConfigPathFromConfig(globals: ConfigGlobals): string {
  const defaultTSConfigFile = getPathToClosestTSConfig();
  if (!globals) {
    return defaultTSConfigFile;
  }

  const tsJestConfig = getTSJestConfig(globals);

  if (tsJestConfig.tsConfigFile) {
    return tsJestConfig.tsConfigFile;
  }

  return defaultTSConfigFile;
}

export function mockGlobalTSConfigSchema(globals: any) {
  const configPath = getTSConfigPathFromConfig(globals);
  return { 'ts-jest': { tsConfigFile: configPath } };
}

export const getTSConfig = _.memoize(getTSConfig_local, (globals, rootDir) => {
  // check cache before resolving configuration
  // NB: We use JSON.stringify() to create a consistent, unique signature. Although it lacks a uniform
  //     shape, this is simpler and faster than using the crypto package to generate a hash signature.
  return JSON.stringify(globals, rootDir);
});

// Non-memoized version of TSConfig
function getTSConfig_local(globals, rootDir: string = '') {
  const configPath = getTSConfigPathFromConfig(globals);
  logOnce(`Reading tsconfig file from path ${configPath}`);
  const skipBabel = getTSJestConfig(globals).skipBabel;

  const config = readCompilerOptions(configPath, rootDir);
  logOnce('Original typescript config before modifications: ', { ...config });

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

  if (config.allowSyntheticDefaultImports && !skipBabel) {
    // compile ts to es2015 and transform with babel afterwards
    config.module = tsc.ModuleKind.ES2015;
  }

  return config;
}

export function cacheFile(
  jestConfig: JestConfig,
  filePath: string,
  src: string,
) {
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

export function injectSourcemapHook(
  filePath: string,
  typeScriptCode: string,
  src: string,
): string {
  const start = src.length > 12 ? src.substr(1, 10) : '';

  const filePathParam = JSON.stringify(filePath);
  const codeParam = JSON.stringify(typeScriptCode);
  const sourceMapHook = `require('ts-jest').install(${filePathParam}, ${codeParam})`;

  return start === 'use strict'
    ? `'use strict';${sourceMapHook};${src}`
    : `${sourceMapHook};${src}`;
}

export function runTsDiagnostics(
  filePath: string,
  compilerOptions: tsc.CompilerOptions,
) {
  const program = tsc.createProgram([filePath], compilerOptions);
  const allDiagnostics = tsc.getPreEmitDiagnostics(program);
  const formattedDiagnostics = allDiagnostics.map(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );
      const message = tsc.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n',
      );
      return `${path.relative(
        process.cwd(),
        diagnostic.file.fileName,
      )} (${line + 1},${character + 1}): ${message}\n`;
    }

    return `${tsc.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`;
  });

  if (formattedDiagnostics.length) {
    throw new Error(formattedDiagnostics.join(''));
  }
}
