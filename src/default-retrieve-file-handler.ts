import * as fs from 'fs';
import { Storage } from './storage';
import { transpileIfTypescript } from './transpile-if-ts';

export function defaultRetrieveFileHandler(path) {
  // Trim the path to make sure there is no extra whitespace.
  path = path.trim();
  if (path in Storage.fileContentsCache) {
    return Storage.fileContentsCache[path];
  }

  try {
    // Use SJAX if we are in the browser
    if (Storage.isInBrowser()) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, false);
      xhr.send(null);
      var contents: string = null;
      if (xhr.readyState === 4 && xhr.status === 200) {
        contents = xhr.responseText;
        contents = transpileIfTypescript(path, contents);
      }
    } else { // Otherwise, use the filesystem
      var contents = fs.readFileSync(path, 'utf8');
      contents = transpileIfTypescript(path, contents);
    }
  } catch (e) {
    var contents: string = null;
  }

  return Storage.fileContentsCache[path] = contents;
}