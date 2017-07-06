import * as tsc from 'typescript';
import { getTSConfigOptionFromConfig, getTSConfig } from './utils';

export function transpileIfTypescript(path, contents, config?) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {

    let transpiled = tsc.transpileModule(contents, {
      compilerOptions: getTSConfig(config || { 'ts-jest': { tsConfigFile: getTSConfigOptionFromConfig(global) }}, true),
      fileName: path
    });

    return transpiled.outputText;
  }
  return contents;
}
