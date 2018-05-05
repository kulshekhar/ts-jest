import * as fs from 'fs';
import { cwd } from 'process';
import * as ts from 'typescript';
import { logOnce } from './logger';

export function transpileTypescript(
  filePath: string,
  fileSrc: string,
  compilerOptions: ts.CompilerOptions,
): string {
  return transpileViaLanguageServer(filePath, fileSrc, compilerOptions);
}

/**
 * This is slower, but can properly parse enums and deal with reflect metadata.
 * This is an experimental approach from our side. Potentially we should cache
 * the languageServer between calls.
 */
function transpileViaLanguageServer(
  filePath: string,
  fileSrc: string,
  compilerOptions: ts.CompilerOptions,
) {
  const serviceHost: ts.LanguageServiceHost = {
    // Returns an array of the files we need to consider
    getScriptFileNames: () => {
      return [filePath];
    },

    getScriptVersion: fileName => {
      // We're not doing any watching or changing files, so versioning is not relevant for us
      return undefined;
    },

    getCurrentDirectory: () => {
      return cwd();
    },

    getScriptSnapshot: fileName => {
      if (fileName === filePath) {
        // jest has already served this file for us, so no need to hit disk again.
        return ts.ScriptSnapshot.fromString(fileSrc);
      }
      // Read file from disk. I think this could be problematic if the files are not saved as utf8.
      const result = fs.readFileSync(fileName, 'utf8');
      return ts.ScriptSnapshot.fromString(result);
    },

    getCompilationSettings: () => {
      return compilerOptions;
    },

    getDefaultLibFileName: () => {
      return ts.getDefaultLibFilePath(compilerOptions);
    },

    // debug stuff
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    getDirectories: ts.sys.getDirectories,
    directoryExists: ts.sys.directoryExists,
  };
  const service = ts.createLanguageService(serviceHost);
  const serviceOutput = service.getEmitOutput(filePath);
  const files = serviceOutput.outputFiles.filter(file => {
    // Service outputs both d.ts and .js files - we're not interested in the declarations.
    return file.name.endsWith('js');
  });
  logOnce('JS files parsed', files.map(f => f.name));

  // Log some diagnostics here:
  const diagnostics = service
    .getCompilerOptionsDiagnostics()
    .concat(service.getSyntacticDiagnostics(filePath))
    .concat(service.getSemanticDiagnostics(filePath));

  if (diagnostics.length > 0) {
    logOnce(
      `Diagnostic errors from TSC: ${diagnostics.map(d => d.messageText)}`,
    );
  }

  return files[0].text;
}

/**
 * This is faster, and considers the modules in isolation
 */
function createTranspileModuleTranspiler() {}
