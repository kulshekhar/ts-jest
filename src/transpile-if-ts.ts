import * as tsc from 'typescript';
import { getTSConfig } from './utils';

export function transpileIfTypescript(path, contents, config?) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {

    const transpiled = tsc.transpileModule(contents, {
      compilerOptions: getTSConfig(config || { __TS_CONFIG__: global['__TS_CONFIG__'] }, true),
      fileName: path,
    });

    return transpiled.outputText;
  }
  return contents;
}
