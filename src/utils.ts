import * as tsc from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import * as tsconfig from 'tsconfig';

const normalize = require('jest-config').normalize;
const setFromArgv = require('jest-config/build/setFromArgv');

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
  config.rootDir = config.rootDir ?
    path.resolve(path.dirname(filePath), config.rootDir) :
    process.cwd();
  return normalize(config, argv);
}

function loadJestConfigFromPackage(filePath, argv) {
  const R_OK = fs.constants && fs.constants.R_OK || <number>fs['R_OK'];
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

  const packageConfig = loadJestConfigFromPackage(path.join(root, 'package.json'), argv);
  return packageConfig || normalize({ rootDir: root }, argv);
}

export function getJestConfig(root) {
  const yargs = require('yargs');
  const argv = yargs(process.argv.slice(2)).argv;
  const rawConfig = readRawConfig(argv, root);
  return Object.freeze(setFromArgv(rawConfig, argv));
}

export function getTSConfig(globals, collectCoverage: boolean = false) {
  let config = (globals && globals.__TS_CONFIG__) ? globals.__TS_CONFIG__ : 'tsconfig.json';

  if (typeof config === 'string') {
    const configFileName = config;
    const configPath = path.resolve(configFileName);
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const external = tsconfig.parse(fileContent, configPath);
    config = external.compilerOptions || {};

    if (typeof external.extends === 'string') {
      const parentConfigPath = path.join(path.dirname(configPath), external.extends);
      const includedContent = fs.readFileSync(parentConfigPath, 'utf8');
      config = Object.assign({}, tsconfig.parse(includedContent, parentConfigPath).compilerOptions, config);
    }

    if (configFileName === 'tsconfig.json') {
      // hardcode module to 'commonjs' in case the config is being loaded
      // from the default tsconfig file. This is to ensure that coverage
      // works well. If there's a need to override, it can be done using
      // the global __TS_CONFIG__ setting in Jest config
      config.module = 'commonjs';
    }
  }

  config.module = config.module || 'commonjs';

  if (config.inlineSourceMap !== false) {
    config.inlineSourceMap = true;
  }

  config.jsx = config.jsx || tsc.JsxEmit.React;

  //inline source with source map for remapping coverage
  if (collectCoverage) {
    if (config.sourceMap) {
      delete config.sourceMap;
    }

    config.inlineSourceMap = true;
    config.inlineSources = true;

    if (config.outDir) {
      // the coverage report is broken if `.outDir` is set
      // see https://github.com/kulshekhar/ts-jest/issues/201
      delete config.outDir;
    }
  }

  if (config.allowSyntheticDefaultImports) {
    // compile ts to es2015 and transform with babel afterwards
    config.module = 'es2015';
  }
  return tsc.convertCompilerOptionsFromJson(config, undefined).options;
}
