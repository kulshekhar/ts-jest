import * as tsc from 'typescript';
import { getTSConfig } from './utils';

export function process(src, path, config) {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    const transpiled = tsc.transpileModule(
      src,
      {
        compilerOptions: getTSConfig(config.globals),
        fileName: path
      });

    const modified = `require('ts-jest').install();${transpiled.outputText}`;

    return modified;
  }

  return src;
}