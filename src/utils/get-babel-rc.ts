import closestFileData from 'closest-file-data';
import { readFileSync } from 'fs';
import {
  BABELRC_FILENAME,
  BABELRC_JS_FILENAME,
  PACKAGE_JSON,
  BABEL_CONFIG_KEY,
} from './constants';
import { BabelTransformOptions } from '../types';

const babelReaders = [
  {
    basename: BABELRC_FILENAME,
    read: f => JSON.parse(readFileSync(f, 'utf8')),
  },
  { basename: BABELRC_JS_FILENAME, read: f => require(f) },
  { basename: PACKAGE_JSON, read: f => require(f)[BABEL_CONFIG_KEY] },
];

export default function getBabelRC(filename): babel.BabylonOptions | void {
  const res = closestFileData(filename, babelReaders);
  return res && res.data;
}
