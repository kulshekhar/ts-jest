import * as sourceMapSupport from 'source-map-support';

export function install() {
  var options: sourceMapSupport.Options = {};
  options.emptyCacheBetweenOperations = true; // left here only for sourceMapCache TODO: check this for correctness and performance with false velue
  options['environment'] = 'node';

  return sourceMapSupport.install(options);
}
