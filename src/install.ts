import * as sourceMapSupport from 'source-map-support';
import { defaultRetrieveFileHandler } from './default-retrieve-file-handler';

export function install() {
  const options: sourceMapSupport.Options = {};

  options.retrieveFile = defaultRetrieveFileHandler;

  /* tslint:disable */
  // disabling tslint because the types for the source-map-support version
  // in use here don't have the 'environment' property on options
  options['environment'] = 'node';
  /* tslint:disable */

  return sourceMapSupport.install(options);
}
