import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from './utils';

function formatTscParserErrors(errors: ts.Diagnostic[]) {
  return errors.map(s => JSON.stringify(s, null, 4)).join('\n');
}

interface File {
  path: string;
  version: number;
  snapshot: ts.IScriptSnapshot;
  src: string;
}

class Files {
  private files: Map<string, File>;
  constructor() {
    this.files = new Map();
  }
  // set(path: string, file: File) {
  //     this.files.set(path, file)
  // }
  update({ path, src }: { path: string; src: string }) {
    const file = this.get(path);
    if (file === undefined) {
      const newFile: File = {
        src,
        path,
        version: 0,
        snapshot: ts.ScriptSnapshot.fromString(src),
      };
      this.files.set(path, newFile);
      return;
    }
    if (file.src === src) {
      return;
    }
    file.src = src;
    file.version += 1;
    file.snapshot = ts.ScriptSnapshot.fromString(src);
  }
  get(path: string) {
    return this.files.get(path);
  }
  getFileNames() {
    return Array.from(this.files.values()).map(f => f.path);
  }
  getScriptVersion(path: string) {
    const f = this.get(path);
    if (f === undefined) {
      return '';
    }
    return f.version.toString();
  }
}

export class Compiler {
  private options?: ts.CompilerOptions;
  private service: ts.LanguageService;
  private files: Files;

  constructor(options?: ts.CompilerOptions) {
    this.files = new Files();
    this.options = options;
    this.service = this.createServiceHost();
  }
  setOptions(options: ts.CompilerOptions) {
    this.options = options;
  }
  private createServiceHost() {
    const { files, options } = this;

    let service: ts.LanguageService;

    class ServiceHost implements ts.LanguageServiceHost {
      // getCustomTransformers() {
      //     return {
      //         before: [tsruntimeTransformer(service.getProgram())]
      //     }
      // }
      getScriptFileNames() {
        return files.getFileNames();
      }
      getScriptVersion(fileName: string) {
        return files.getScriptVersion(fileName);
      }
      getScriptSnapshot(fileName: string) {
        const file = files.get(fileName);
        if (file !== undefined) {
          return file.snapshot;
        }
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(
          fs.readFileSync(fileName).toString(),
        ); //todo maybe put to files cache
      }
      getCurrentDirectory = () => process.cwd();
      getCompilationSettings = () => options;
      getDefaultLibFileName = (options: ts.CompilerOptions) =>
        ts.getDefaultLibFilePath(options);
      fileExists = ts.sys.fileExists;
      readFile = ts.sys.readFile;
      readDirectory = ts.sys.readDirectory;
      // resolveTypeReferenceDirectives(typeDirectiveNames: string[], containingFile: string) {
      //     const resolved = typeDirectiveNames.map(directive =>
      //         ts.resolveTypeReferenceDirective(directive, containingFile, options, ts.sys)
      //             .resolvedTypeReferenceDirective);

      //     // resolved.forEach(res => {
      //     if (res && res.resolvedFileName) {
      //         fileDeps.add(containingFile, res.resolvedFileName);
      //     }
      // });

      // return resolved;
      // }
    }

    service = ts.createLanguageService(
      new ServiceHost(),
      ts.createDocumentRegistry(),
    );

    return service;
  }

  emitFile({ path, src }: { path: string; src: string }) {
    this.files.update({ path, src });

    let output = this.service.getEmitOutput(path);

    if (output.emitSkipped) {
      this.logErrors(path);
    }
    const res = utils.findResultFor(path, output);
    return res;
  }

  private logErrors(fileName: string) {
    let allDiagnostics = this.service
      .getCompilerOptionsDiagnostics()
      .concat(this.service.getSyntacticDiagnostics(fileName))
      .concat(this.service.getSemanticDiagnostics(fileName));

    allDiagnostics.forEach(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n',
      );
      if (diagnostic.file) {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start!,
        );
        console.log(
          `  Error ${diagnostic.file.fileName} (${line + 1},${character +
            1}): ${message}`,
        );
      } else {
        console.log(`  Error: ${message}`);
      }
    });
  }
}
