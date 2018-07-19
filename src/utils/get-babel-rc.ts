import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {
  BABELRC_FILENAME,
  BABELRC_JS_FILENAME,
  PACKAGE_JSON,
  BABEL_CONFIG_KEY,
} from './constants';
import { TsJestContext } from '../types';

// ideally we'd get that from babel-jest if it was exported,
// this is a pure translation from js
export default function getBabelRC(filename, { cache }: TsJestContext) {
  const paths = [];
  let directory = filename;
  // tslint:disable-next-line:no-conditional-assignment
  while (directory !== (directory = dirname(directory))) {
    if (cache[directory]) {
      break;
    }

    paths.push(directory);
    const configFilePath = join(directory, BABELRC_FILENAME);
    if (existsSync(configFilePath)) {
      cache[directory] = readFileSync(configFilePath, 'utf8');
      break;
    }
    const configJsFilePath = join(directory, BABELRC_JS_FILENAME);
    if (existsSync(configJsFilePath)) {
      cache[directory] = JSON.stringify(require(configJsFilePath));
      break;
    }
    const resolvedJsonFilePath = join(directory, PACKAGE_JSON);
    const packageJsonFilePath =
      resolvedJsonFilePath === PACKAGE_JSON
        ? resolve(directory, PACKAGE_JSON)
        : resolvedJsonFilePath;
    if (existsSync(packageJsonFilePath)) {
      const packageJsonFileContents = require(packageJsonFilePath);
      if (packageJsonFileContents[BABEL_CONFIG_KEY]) {
        cache[directory] = JSON.stringify(
          packageJsonFileContents[BABEL_CONFIG_KEY],
        );
        break;
      }
    }
  }
  paths.forEach(directoryPath => (cache[directoryPath] = cache[directory]));
  return cache[directory] || '';
}
