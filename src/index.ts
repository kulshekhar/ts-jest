import * as sourceMapSupport from 'source-map-support';
import { defaultRetrieveFileHandler } from './default-retrieve-file-handler';

export { transpileIfTypescript } from './transpile-if-ts';
export function install() {
  let options: sourceMapSupport.Options = {};
  options.retrieveFile = defaultRetrieveFileHandler;
  options.emptyCacheBetweenOperations = true; // left here only for sourceMapCache TODO: check this for correctness and performance with false velue
  options['environment'] = 'node';

  return sourceMapSupport.install(options);
}
