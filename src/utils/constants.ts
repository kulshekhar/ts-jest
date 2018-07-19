import { readFileSync } from 'fs';
import { resolve } from 'path';

export const BABELRC_FILENAME = '.babelrc';
export const BABELRC_JS_FILENAME = '.babelrc.js';
export const BABEL_CONFIG_KEY = 'babel';
export const TSCONFIG_FILENAME = 'tsconfig.json';
export const TSCONFIG_GLOBALS_KEY = 'ts-jest';
export const PACKAGE_JSON = 'package.json';
export const MY_PACKAGE_CONTENT = readFileSync(
  resolve(__dirname, '..', '..', PACKAGE_JSON),
);
