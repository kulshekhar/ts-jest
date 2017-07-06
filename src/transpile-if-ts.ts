import * as tsc from 'typescript';
import { getTSConfig } from './utils';

export function transpileIfTypescript(path, contents, config?) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {

    const transpiled = tsc.transpileModule(contents, {
      /* tslint:disable */
      compilerOptions: getTSConfig(config || { __TS_CONFIG__: global['__TS_CONFIG__'] }, true),
      /* tslint:enable */
      fileName: path,
    });

    return transpiled.outputText;
  }
  return contents;
}
