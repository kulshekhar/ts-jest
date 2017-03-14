import { defaultRetrieveFileHandler } from './default-retrieve-file-handler';
import * as sourceMapSupport from 'source-map-support';

export { transpileIfTypescript } from './transpile-if-ts';
export function install() {
  var options: sourceMapSupport.Options = {};
  options.retrieveFile = defaultRetrieveFileHandler;
  options.emptyCacheBetweenOperations = true; // left here only for sourceMapCache TODO: check this for correctness and performance with false velue
  options['environment'] = 'node';

  return sourceMapSupport.install(options);
}
