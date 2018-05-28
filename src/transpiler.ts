import * as fs from 'fs';
import { cwd } from 'process';
import * as ts from 'typescript';
import { logOnce } from './logger';
import { CodeSourceMapPair, TsJestConfig } from './jest-types';

// Takes the typescript code and by whatever method configured, makes it into javascript code.
export function transpileTypescript(
  filePath: string,
  fileSrc: string,
  compilerOptions: ts.CompilerOptions,
): CodeSourceMapPair {
  logOnce('Compiling via normal transpileModule call');
  const transpileOutput = transpileViaTranspileModule(
    filePath,
    fileSrc,
    compilerOptions,
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
  compilerOptions: ts.CompilerOptions,
): ts.TranspileOutput {
  return ts.transpileModule(fileSource, {
    compilerOptions,
    fileName: filePath,
  });
}
