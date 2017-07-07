import * as tsc from 'typescript';
import { getTSConfig, getTSConfigOptionFromConfig, mockGlobalTSConfigSchema } from './utils';

export function transpileIfTypescript(path, contents, config?) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {

    let transpiled = tsc.transpileModule(contents, {
      compilerOptions: getTSConfig(config || mockGlobalTSConfigSchema(global), true),
      fileName: path,
    });

    return transpiled.outputText;
  }
  return contents;
}
