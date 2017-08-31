import * as fs from 'fs';
import { normalize } from 'jest-config';
import * as path from 'path';
import * as tsc from 'typescript';
import { TsJestConfig } from './jest-types';
/* tslint:disable */

const setFromArgv = require('jest-config/build/setFromArgv');
// import * as setFromArgv from 'jest-config/build/setfromArgv';
/* tslint:enable */

function parseConfig(argv) {
  if (argv.config && typeof argv.config === 'string') {
    // If the passed in value looks like JSON, treat it as an object.
    if (argv.config[0] === '{' && argv.config[argv.config.length - 1] === '}') {
      return JSON.parse(argv.config);
    }
  }
  return argv.config;
}

function loadJestConfigFromFile(filePath, argv) {
  const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  config.rootDir = config.rootDir
    ? path.resolve(path.dirname(filePath), config.rootDir)
    : process.cwd();
  return normalize(config, argv);
}

function loadJestConfigFromPackage(filePath, argv) {
  /* tslint:disable */
  const R_OK = (fs.constants && fs.constants.R_OK) || (fs['R_OK'] as number);
  /* tslint:enable */
  try {
    fs.accessSync(filePath, R_OK);
  } catch (e) {
    return null;
  }

  const packageData = require(filePath);
  const config = packageData.jest || {};
  const root = path.dirname(filePath);
  config.rootDir = config.rootDir ? path.resolve(root, config.rootDir) : root;
  return normalize(config, argv);
}

function readRawConfig(argv, root) {
  const rawConfig = parseConfig(argv);

  if (typeof rawConfig === 'string') {
    return loadJestConfigFromFile(path.resolve(process.cwd(), rawConfig), argv);
  }

  if (typeof rawConfig === 'object') {
    const config = Object.assign({}, rawConfig);
    config.rootDir = config.rootDir || root;
    return normalize(config, argv);
  }

  const packageConfig = loadJestConfigFromPackage(
    path.join(root, 'package.json'),
    argv,
  );
  return packageConfig || normalize({ rootDir: root }, argv);
}

export function getJestConfig(root) {
  const yargs = require('yargs');
  const argv = yargs(process.argv.slice(2)).argv;
  const rawConfig = readRawConfig(argv, root);
  return Object.freeze(setFromArgv(rawConfig, argv));
}

export function getTSJestConfig(globals: any): TsJestConfig {
  return globals && globals['ts-jest'] ? globals['ts-jest'] : {};
}

function formatTscParserErrors(errors: tsc.Diagnostic[]) {
  return errors.map(s => JSON.stringify(s, null, 4)).join('\n');
}

function readCompilerOptions(configPath: string) {
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

export function getTSConfigOptionFromConfig(globals: any) {
  if (!globals) {
    return 'tsconfig.json';
  }

  const tsJestConfig = getTSJestConfig(globals);

  if (globals.__TS_CONFIG__) {
    console.warn(`Using globals > __TS_CONFIG__ option for setting TS config is deprecated.
Please set config using this option:\nglobals > ts-jest > tsConfigFile (string).
More information at https://github.com/kulshekhar/ts-jest#tsconfig`);
    return globals.__TS_CONFIG__;
  } else if (tsJestConfig.tsConfigFile) {
    return tsJestConfig.tsConfigFile;
  }

  return 'tsconfig.json';
}

export function mockGlobalTSConfigSchema(globals: any) {
  const config = getTSConfigOptionFromConfig(globals);
  return typeof config === 'string'
    ? { 'ts-jest': { tsConfigFile: config } }
    : { __TS_CONFIG__: config };
}

const tsConfigCache: { [key: string]: any } = {};
export function getTSConfig(globals, collectCoverage: boolean = false) {
  let config = getTSConfigOptionFromConfig(globals);
  const skipBabel = getTSJestConfig(globals).skipBabel;
  const isReferencedExternalFile = typeof config === 'string';

  // check cache before resolving configuration
  // NB: config is a string unless taken from __TS_CONFIG__, which should be immutable (and is deprecated anyways)
  // NB: We use JSON.stringify() to create a consistent, unique signature. Although it lacks a uniform
  //     shape, this is simpler and faster than using the crypto package to generate a hash signature.
  const tsConfigCacheKey = JSON.stringify([
    skipBabel,
    collectCoverage,
    isReferencedExternalFile ? config : undefined,
  ]);
  if (tsConfigCacheKey in tsConfigCache) {
    return tsConfigCache[tsConfigCacheKey];
  }

  if (isReferencedExternalFile) {
    const configFileName = config;
    const configPath = path.resolve(config);

    config = readCompilerOptions(configPath);

    if (configFileName === 'tsconfig.json') {
      // hardcode module to 'commonjs' in case the config is being loaded
      // from the default tsconfig file. This is to ensure that coverage
      // works well. If there's a need to override, it can be done using
      // the global __TS_CONFIG__ setting in Jest config
      config.module = tsc.ModuleKind.CommonJS;
    }
  }

  // ts-jest will map lines numbers properly if inlineSourceMap and
  // inlineSources are set to true. For testing, we don't need the
  // sourceMap configuration
  delete config.sourceMap;
  config.inlineSourceMap = true;
  config.inlineSources = true;

  // the coverage report is broken if `.outDir` is set
  // see https://github.com/kulshekhar/ts-jest/issues/201
  // `.outDir` is removed even for test files as it affects with breakpoints
  // see https://github.com/kulshekhar/ts-jest/issues/309
  delete config.outDir;

  // Note: If we had to read the inline configuration, it's required to set the fields
  // to their string properties, and convert the result accordingly afterwards.
  // In case of an external file, reading the config file already converted it as well, and
  // an additional attempt would lead to errors.
  let result;
  if (isReferencedExternalFile) {
    config.jsx = config.jsx || tsc.JsxEmit.React;
    config.module = config.module || tsc.ModuleKind.CommonJS;
    if (config.allowSyntheticDefaultImports && !skipBabel) {
      // compile ts to es2015 and transform with babel afterwards
      config.module = tsc.ModuleKind.ES2015;
    }
    result = config;
  } else {
    config.jsx = config.jsx || 'react';
    config.module = config.module || 'commonjs';
    if (config.allowSyntheticDefaultImports && !skipBabel) {
      // compile ts to es2015 and transform with babel afterwards
      config.module = 'es2015';
    }
    const converted = tsc.convertCompilerOptionsFromJson(config, undefined);
    if (converted.errors && converted.errors.length > 0) {
      const formattedErrors = formatTscParserErrors(converted.errors);
      throw new Error(
        `Some errors occurred while attempting to convert ${JSON.stringify(
          config,
        )}: ${formattedErrors}`,
      );
    }
    result = converted.options;
  }

  // cache result for future requests
  tsConfigCache[tsConfigCacheKey] = result;
  return result;
}
