import closestFileData from 'closest-file-data';
import { readFileSync } from 'fs';
import { parse } from 'json5';
import {
  BABELRC_FILENAME,
  BABELRC_JS_FILENAME,
  PACKAGE_JSON,
  BABEL_CONFIG_KEY,
} from './constants';

const babelReaders = [
  {
    basename: BABELRC_FILENAME,
    read: f => parse(readFileSync(f, 'utf8')),
  },
  { basename: BABELRC_JS_FILENAME, read: f => require(f) },
  { basename: PACKAGE_JSON, read: f => require(f)[BABEL_CONFIG_KEY] },
];

export default function getBabelRC(filename): babel.BabylonOptions | void {
  const res = closestFileData(filename, babelReaders);
  return res && res.data;
}
