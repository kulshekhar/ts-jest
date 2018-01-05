import * as sourceMapSupport from 'source-map-support';

export function install(filePath: string, fileContent: string) {
  const options: sourceMapSupport.Options = {};

  options.retrieveFile = path => (path === filePath ? fileContent : undefined);

  /* tslint:disable */
  // disabling tslint because the types for the source-map-support version
  // in use here don't have the 'environment' property on options
  options['environment'] = 'node';
  /* tslint:disable */

  return sourceMapSupport.install(options);
}
