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
  const transpileOutput = transpileViaTranspileModile(
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
function transpileViaTranspileModile(
  filePath: string,
  fileSource: string,
  compilerOptions: ts.CompilerOptions,
): ts.TranspileOutput {
  const transpileOutput = ts.transpileModule(fileSource, {
    compilerOptions,
    fileName: filePath,
    reportDiagnostics: true,
  });
  const {diagnostics} = transpileOutput;

  if (diagnostics.length > 0) {
    const errors = formatDiagnostics(diagnostics);
    logOnce(logMessageForTranspilationErrors(errors));
    // Maybe we should keep compiling even though there are errors. This can possibly be configured.
    throw createTranspilationError(errors);
  }

  return transpileOutput;
}

function formatDiagnostics(diagnostics: ts.Diagnostic[]): string {
  // TODO consider using ts.formatDiagnosticsWithColorAndContext()
  return `${diagnostics.map(d => d.messageText)}\n`;
}

function createTranspilationError(errors: string): Error {
    return Error(
      `TSC language server encountered errors while transpiling. Errors: ${errors}`,
    );
}

function logMessageForTranspilationErrors(errors: string): string {
  return `Diagnostic errors from TSC: ${errors}`;
}
