import * as fs from 'fs';
import { cwd } from 'process';
// Only for types; take care never to use ts_types in expressions, only in type annotations
import * as ts_types from 'typescript';
import { logOnce } from './utils/logger';
import { getTypescriptCompiler } from './custom-compiler';
import { TsJestConfig } from './types';

// Takes the typescript code and by whatever method configured, makes it into javascript code.
export function transpileTypescript(
  filePath: string,
  fileSrc: string,
  compilerOptions: ts_types.CompilerOptions,
  tsJestConfig: TsJestConfig,
): jest.TransformedSource {
  logOnce('Compiling via normal transpileModule call');
  const ts = getTypescriptCompiler(tsJestConfig);
  const { outputText: code, sourceMapText: map } = transpileViaTranspileModule(
    filePath,
    fileSrc,
    compilerOptions,
    ts,
  );
  return { code, map };
}

/**
 * This is faster, and considers the modules in isolation
 */
function transpileViaTranspileModule(
  filePath: string,
  fileSource: string,
  compilerOptions: ts_types.CompilerOptions,
  ts: typeof ts_types,
): ts_types.TranspileOutput {
  const transpileOutput = ts.transpileModule(fileSource, {
    compilerOptions,
    fileName: filePath,
    reportDiagnostics: true,
  });
  const { diagnostics } = transpileOutput;

  if (diagnostics.length > 0) {
    const errors = formatDiagnostics(diagnostics);
    logOnce(logMessageForTranspilationErrors(errors));
    // Maybe we should keep compiling even though there are errors. This can possibly be configured.
    throw createTranspilationError(errors);
  }

  return transpileOutput;
}

function formatDiagnostics(diagnostics: ts_types.Diagnostic[]): string {
  // TODO consider using ts.formatDiagnosticsWithColorAndContext()
  return `${diagnostics.map(d => d.messageText)}\n`;
}

function createTranspilationError(errors: string): Error {
  return Error(
    `TypeScript compiler encountered syntax errors while transpiling. Errors: ${errors}`,
  );
}

function logMessageForTranspilationErrors(errors: string): string {
  return `Diagnostic errors from TSC: ${errors}`;
}
