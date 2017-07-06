import * as fs from 'fs';
import { transpileIfTypescript } from './transpile-if-ts';

export function defaultRetrieveFileHandler(path) {
  // Trim the path to make sure there is no extra whitespace.
  path = path.trim();

  // This was removed because it seems that we can't use cache while expecting correct results
  // TODO: check correctness and performance with file caching
  // if (path in fileContentsCache) {
  //   return fileContentsCache[path];
  // }

  let contents: string;
  try {
    contents = fs.readFileSync(path, 'utf8');
    contents = transpileIfTypescript(path, contents);
  } catch (e) {
    contents = null;
  }

  return contents;
}
