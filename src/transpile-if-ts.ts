import * as tsc from 'typescript';
import { getTSConfig, mockGlobalTSConfigSchema } from './utils';
import { ConfigGlobals } from './jest-types';

export function transpileIfTypescript(
  path: string,
  contents: string,
  config?: ConfigGlobals,
  rootDir: string = '',
): string {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {
    const transpiled = tsc.transpileModule(contents, {
      compilerOptions: getTSConfig(
        config || mockGlobalTSConfigSchema(global),
        rootDir,
      ),
      fileName: path,
    });

    return transpiled.outputText;
  }
  return contents;
}
