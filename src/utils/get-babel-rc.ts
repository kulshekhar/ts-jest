import closestFileData from 'closest-file-data';
import { readFileSync } from 'fs';
import {
  BABELRC_FILENAME,
  BABELRC_JS_FILENAME,
  PACKAGE_JSON,
  BABEL_CONFIG_KEY,
} from './constants';
import { importJson5 } from './imports';

// Don't import JSON5 parser unless specifically asked to parse a babel config file
let parse;
function parseBabelConfig(config) {
  if (parse == null) {
    parse = importJson5().parse;
  }
  return parse(config);
}

const babelReaders = [
  {
    basename: BABELRC_FILENAME,
    read: f => parseBabelConfig(readFileSync(f, 'utf8')),
  },
  { basename: BABELRC_JS_FILENAME, read: f => require(f) },
  { basename: PACKAGE_JSON, read: f => require(f)[BABEL_CONFIG_KEY] },
];

export default function getBabelRC(filename): babel.BabylonOptions | void {
  const res = closestFileData(filename, babelReaders);
  return res && res.data;
}
