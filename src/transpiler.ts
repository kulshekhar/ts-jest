import * as fs from 'fs';
import { cwd } from 'process';
// Only for types; take care never to use ts_ in expressions, only in type annotations
import * as ts_ from 'typescript';
import { logOnce } from './logger';
import { CodeSourceMapPair, TsJestConfig } from './jest-types';
import { getTypescriptCompiler } from './custom-compiler';

// Takes the typescript code and by whatever method configured, makes it into javascript code.
export function transpileTypescript(
  filePath: string,
  fileSrc: string,
  compilerOptions: ts_.CompilerOptions,
  tsJestConfig: TsJestConfig,
): CodeSourceMapPair {
  logOnce('Compiling via normal transpileModule call');
  const ts = getTypescriptCompiler(tsJestConfig);
  const transpileOutput = transpileViaTranspileModule(
    filePath,
    fileSrc,
    compilerOptions,
    ts,
  );
  return {
    code: transpileOutput.outputText,
    map: transpileOutput.sourceMapText,
  };
}

/**
 * This is faster, and considers the modules in isolation
 */
function transpileViaTranspileModule(
  filePath: string,
  fileSource: string,
  compilerOptions: ts_.CompilerOptions,
  ts: typeof ts_,
): ts_.TranspileOutput {
  return ts.transpileModule(fileSource, {
    compilerOptions,
    fileName: filePath,
  });
}
