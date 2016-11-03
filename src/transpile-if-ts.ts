import * as tsc from 'typescript';
import { getTSConfig } from './utils';

export function transpileIfTypescript(path, contents) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {

    let transpiled = tsc.transpileModule(contents, {
      compilerOptions: addSourceMapToTSConfig(),
      fileName: path
    });

    return transpiled.outputText;
  }
  return contents;
}

function addSourceMapToTSConfig() {
  // if a global __TS_CONFIG__ is set, update the compiler setting to include inline SourceMap
  var config = getTSConfig({ __TS_CONFIG__: global['__TS_CONFIG__'] }, true);
  return config;
}