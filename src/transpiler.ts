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
): string {
  if (tsJestConfig.useExperimentalLanguageServer) {
    logOnce('Using experimental language server.');
    return transpileViaLanguageServer(filePath, fileSrc, compilerOptions);
  }
  logOnce('Compiling via normal transpileModule call');
  return transpileViaTranspileModile(filePath, fileSrc, compilerOptions);
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
    const errors = `${diagnostics.map(d => d.messageText)}\n`;
    logOnce(`Diagnostic errors from TSC: ${errors}`);
    // Maybe we should keep compiling even though there are errors. This can possibly be configured.
    throw Error(
      `TSC language server encountered errors while transpiling. Errors: ${errors}`,
    );
  }

  return files[0].text;
}

/**
 * This is faster, and considers the modules in isolation
 */
function transpileViaTranspileModile(
  filePath: string,
  fileSource: string,
  compilerOptions: ts.CompilerOptions,
) {
  return ts.transpileModule(fileSource, {
    compilerOptions,
    fileName: filePath,
  }).outputText;
}
