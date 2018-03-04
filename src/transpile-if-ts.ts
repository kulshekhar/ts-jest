import * as tsc from 'typescript';
import { getTSConfig, mockGlobalTSConfigSchema } from './utils';

export function transpileIfTypescript(
  path,
  contents,
  config?,
  rootDir: string = '',
) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {
    const transpiled = tsc.transpileModule(contents, {
      compilerOptions: getTSConfig(
        config || mockGlobalTSConfigSchema(global),
        rootDir,
        true,
      ),
      fileName: path,
    });

    return transpiled.outputText;
  }
  return contents;
}
