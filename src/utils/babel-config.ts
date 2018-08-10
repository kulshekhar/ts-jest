import { readFileSync } from 'fs';
import parseJsonUnsafe from './parse-json-unsafe';
import { BabelConfig } from '../types';
import importer, { ImportReasons } from './importer';

const BABELRC_FILENAME = '.babelrc';
const BABELRC_JS_FILENAME = '.babelrc.js';
const BABEL_CONFIG_KEY = 'babel';
const PACKAGE_JSON = 'package.json';

const babelReaders = [
  {
    basename: BABELRC_FILENAME,
    read: f => parseJsonUnsafe(readFileSync(f, 'utf8')),
  },
  { basename: BABELRC_JS_FILENAME, read: f => require(f) },
  { basename: PACKAGE_JSON, read: f => require(f)[BABEL_CONFIG_KEY] },
];

export function loadDefault(filename = process.cwd()): BabelConfig | undefined {
  const findClosest = importer.closestFileData(ImportReasons.babelConfigLookup);
  const res = findClosest(filename, babelReaders);
  return res && res.data;
}

export function extend(
  base: BabelConfig = {},
  // tslint:disable-next-line:no-shadowed-variable
  extend: BabelConfig = {},
  // tslint:disable-next-line:trailing-comma
  ...others: BabelConfig[]
): BabelConfig {
  const res = Object.assign(base, extend, ...others, {
    presets: base.presets ? base.presets.slice() : [],
    plugins: extend.plugins ? extend.plugins.slice() : [],
  });
  others.unshift(extend);
  others.forEach(other => {
    if (other.presets) {
      res.presets.push(...other.presets);
    }
    if (other.plugins) {
      res.plugins.push(...other.plugins);
    }
  });
  return res;
}

export function freeze(config: BabelConfig): BabelConfig {
  Object.freeze(config.presets);
  Object.freeze(config.plugins);
  return Object.freeze(config);
}
