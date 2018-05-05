import * as fs from 'fs';
import { normalize } from 'jest-config';
import * as setFromArgv from 'jest-config/build/set_from_argv';
import * as path from 'path';
import * as _ from 'lodash';

function readRawConfig(argv: string, root: string) {
  const rawConfig = parseConfig(argv);

  if (typeof rawConfig === 'string') {
    return loadJestConfigFromFile(path.resolve(process.cwd(), rawConfig), argv);
  }

  if (typeof rawConfig === 'object') {
    const config = Object.assign({}, rawConfig);
    config.rootDir = config.rootDir || root;
    return normalize(config, argv);
  }

  // Rawconfig is undefined
  const packageConfig = loadJestConfigFromPackage(
    path.join(root, 'package.json'),
    argv,
  );
  return packageConfig || normalize({ rootDir: root }, argv);
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

function parseConfig(argv) {
  if (argv.config && typeof argv.config === 'string') {
    // If the passed in value looks like JSON, treat it as an object.
    if (argv.config.startsWith('{') && argv.config.endsWith('}')) {
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

export function getJestConfig(root: string) {
  const yargs = require('yargs');
  const argv = yargs(process.argv.slice(2)).argv;
  const rawConfig = readRawConfig(argv, root);
  return Object.freeze(setFromArgv.default(rawConfig, argv));
}
