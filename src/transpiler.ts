import * as fs from 'fs';
import { cwd } from 'process';
import * as ts from 'typescript';
import { logOnce } from './logger';
import { TsJestConfig } from './jest-types';

// Takes the typescript code and by whatever method configured, makes it into javascript code.
export function transpileTypescript(
  filePath: string,
  fileSrc: string,
  compilerOptions: ts.CompilerOptions,
  tsJestConfig: TsJestConfig,
): ts.TranspileOutput {
  logOnce('Compiling via normal transpileModule call');
  return transpileViaTranspileModile(filePath, fileSrc, compilerOptions);
}

/**
 * This is faster, and considers the modules in isolation
 */
function transpileViaTranspileModile(
  filePath: string,
  fileSource: string,
  compilerOptions: ts.CompilerOptions,
): ts.TranspileOutput {
  return ts.transpileModule(fileSource, {
    compilerOptions,
    fileName: filePath,
  });
}
