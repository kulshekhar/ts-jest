import * as tsc from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

import assign = require('lodash.assign');
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
    const config = assign({}, rawConfig);
    config.rootDir = config.rootDir || root;
    return normalize(config, argv);
  }

  const packageConfig = loadJestConfigFromPackage(path.join(root, 'package.json'), argv);
  return packageConfig || normalize({ rootDir: root }, argv);
}

export function getJestConfig(root) {
  try {
    const yargs = require('yargs');
    const argv = yargs(process.argv.slice(2)).argv;
    const rawConfig = readRawConfig(argv, root);
    return Object.freeze(setFromArgv(rawConfig, argv));
  } catch (e) {
    return {};
  }
}

export function getTSConfig(globals, collectCoverage: boolean = false) {
  let config = (globals && globals.__TS_CONFIG__) ? globals.__TS_CONFIG__ : undefined;
  if (config === undefined) {
    config = 'tsconfig.json';
  }
  if (typeof config === 'string') {
    const configPath = path.resolve(config);
    const external = require(configPath);
    config = external.compilerOptions || {};

    if (typeof external.extends === 'string') {
      const parentConfigPath = path.join(path.dirname(configPath), external.extends);
      config = Object.assign({}, require(parentConfigPath).compilerOptions, config);
    }
  }
  config.module = config.module || tsc.ModuleKind.CommonJS;
  config.jsx = config.jsx || tsc.JsxEmit.React;

  //inline source with source map for remapping coverage
  if (collectCoverage) {
    if (config.sourceMap) {
      delete config.sourceMap;
    }

    config.inlineSourceMap = true;
    config.inlineSources = true;
  }

  return tsc.convertCompilerOptionsFromJson(config, undefined).options;
}
