// tslint:disable:member-ordering
import { TsJestConfig, DiagnosticTypes } from './types';
import {
  FormatDiagnosticsHost,
  sys,
  findConfigFile,
  CompilerOptions,
  Diagnostic,
  flattenDiagnosticMessageText,
  readConfigFile,
  parseJsonConfigFileContent,
  ModuleKind,
  CustomTransformers,
  Program,
  ParsedCommandLine,
  ParseConfigHost,
  createCompilerHost,
  createProgram,
  CompilerHost,
} from 'typescript';
import { sep, resolve, dirname, basename } from 'path';
import { existsSync, readFileSync } from 'fs';
import Memoize from './memoize';
import fileExtension from './utils/file-extension';
// import { fixupCompilerOptions } from './utils/ts-internals';

export const compilerOptionsOverrides: Readonly<CompilerOptions> = {
  // ts-jest
  module: ModuleKind.CommonJS,
  esModuleInterop: true,
  inlineSources: undefined,
  sourceMap: false,
  inlineSourceMap: true,

  // see https://github.com/Microsoft/TypeScript/blob/master/src/services/transpile.ts
  isolatedModules: true,
  // transpileModule does not write anything to disk so there is no need to verify that
  // there are no conflicts between input and output paths.
  suppressOutputPathCheck: true,
  // Filename can be non-ts file.
  allowNonTsExtensions: true,
  // We are not returning a sourceFile for lib file when asked by the program,
  // so pass --noLib to avoid reporting a file not found error.
  noLib: true,
  // Clear out other settings that would not be used in transpiling this module
  // lib: undefined,
  // types: undefined,
  noEmit: undefined,
  noEmitOnError: undefined,
  // paths: undefined,
  // rootDirs: undefined,
  declaration: undefined,
  declarationDir: undefined,
  out: undefined,
  outFile: undefined,
  // We are not doing a full typecheck, we are not resolving the whole context,
  // so pass --noResolve to avoid reporting missing file errors.
  noResolve: true,
};

export default class TsProgram {
  // a cache of all transpiled files
  protected _inputSource = new Map<string, string>();
  protected _transpiledSource = new Map<string, string>();
  protected _transpiledMap = new Map<string, string>();
  protected _transpiledDiagnostics = new Map<string, Diagnostic[]>();

  constructor(readonly rootDir: string, readonly tsJestConfig: TsJestConfig) {}

  @Memoize()
  get formatHost(): FormatDiagnosticsHost {
    return {
      getCanonicalFileName: path => path,
      getCurrentDirectory: () => this.rootDir,
      getNewLine: () => sys.newLine,
    };
  }

  @Memoize()
  get fileNameNormalizer() {
    // const { rootDir } = this;
    // return (path: string): string => resolve(rootDir, path);
    return (path: string): string => path;
  }

  @Memoize()
  get compilerHost(): CompilerHost {
    const { fileNameNormalizer, overriddenCompilerOptions } = this;
    const options = { ...overriddenCompilerOptions };
    return {
      ...createCompilerHost(options, true),
      // overrides
      // useCaseSensitiveFileNames: () => false,
      // getCanonicalFileName: fileName => fileName,
      writeFile: (name, text) => {
        const key = fileNameNormalizer(name);
        if (fileExtension(name) === 'map') {
          this._transpiledMap.set(key, text);
        } else {
          this._transpiledSource.set(key, text);
        }
      },
      // getSourceFile: (fileName) => {
      //   const key = fileNameNormalizer(fileName);
      //   const content = this._inputSource.get(key);
      //   // if (content == null) {
      //   //   throw new Error(
      //   //     `[ts-jest] Trying to get a source file content outside of Jest (file: ${fileName}).`,
      //   //   );
      //   // }
      //   return createSourceFile(fileName, content || '', options.target!,);
      // },
      fileExists: fileName =>
        this._inputSource.has(fileNameNormalizer(fileName)),
      readFile: fileName => {
        const content = this._inputSource.get(fileNameNormalizer(fileName));
        if (content == null) {
          throw new Error(
            `[ts-jest] Trying to get the content of a file outside of Jest (file: ${fileName}).`,
          );
        }
        return content;
      },

      // NOTE: below are the ones used in TypeScript's transpileModule()
      // getDefaultLibFileName: () => 'lib.d.ts',
      // getCurrentDirectory: () => this.rootDir,
      // getNewLine: () => newLine,
      // directoryExists: () => true,
      // getDirectories: () => [],
    };
  }

  @Memoize()
  get configFile(): string | null {
    const given = this.tsJestConfig.inputOptions.tsConfig;
    let resolved: string | undefined;
    if (typeof given === 'string') {
      // we got a path to a custom (or not) tsconfig
      resolved = given.replace('<rootDir>', `${this.rootDir}${sep}`);
      resolved = resolve(this.rootDir, resolved);
      if (!existsSync(resolved)) {
        resolved = undefined;
      }
    } else if (typeof given === 'undefined') {
      // we got undefined, go look for the default file
      resolved = findConfigFile(this.rootDir, sys.fileExists, 'tsconfig.json');
    } else {
      // what we got was compiler options
      return null;
    }
    // could we find one?
    if (!resolved) {
      throw new Error(
        `Could not find a TS config file (given: "${given}", root: "${
          this.rootDir
        }")`,
      );
    }
    return resolved;
  }

  @Memoize()
  get program(): Program {
    const {
      parsedConfig: { fileNames },
      overriddenCompilerOptions: options,
    } = this;
    const compilerOptions = { ...options };

    const host = this.compilerHost;
    return createProgram(fileNames, compilerOptions, host);
  }

  @Memoize()
  get originalCompilerOptions() {
    return { ...this.parsedConfig.options } as CompilerOptions;
  }

  @Memoize()
  get overriddenCompilerOptions() {
    return {
      ...this.originalCompilerOptions,
      ...compilerOptionsOverrides,
    } as CompilerOptions;
  }

  @Memoize()
  get parsedConfig(): ParsedCommandLine {
    const { configFile } = this;
    const { config, error } = configFile
      ? readConfigFile(configFile, sys.readFile)
      : {
          config: { compilerOptions: this.tsJestConfig.inputOptions.tsConfig },
          error: undefined,
        };
    if (error) throw error; // tslint:disable-line:curly

    const parseConfigHost: ParseConfigHost = {
      fileExists: existsSync,
      readDirectory: sys.readDirectory,
      readFile: file => readFileSync(file, 'utf8'),
      useCaseSensitiveFileNames: true,
    };

    const result = parseJsonConfigFileContent(
      config,
      parseConfigHost,
      configFile ? dirname(configFile) : this.rootDir,
      undefined,
      configFile ? basename(configFile) : undefined,
    );

    // will throw if at least one error
    this.reportDiagnostic(...result.errors);

    return result;
  }

  // transpileModule(
  //   path: string,
  //   content: string,
  //   instrument: boolean = false,
  // ): string {
  //   const options: TranspileOptions = {
  //     fileName: path,
  //     reportDiagnostics: false, // TODO: make this an option
  //     transformers: this.transformers,
  //     compilerOptions: { ...this.overriddenCompilerOptions },
  //   };
  //   const { diagnostics, outputText } = transpileModule(content, options);
  //   // TODO: handle diagnostics
  //   this.reportDiagnostic(...diagnostics);

  //   // outputText will contain inline sourmaps
  //   return outputText;
  // }

  transpileModule(
    path: string,
    content: string,
    instrument: boolean = false,
  ): string {
    const {
      program,
      tsJestConfig: { diagnostics: diagnosticTypes },
      fileNameNormalizer,
    } = this;
    const diagnostics: Diagnostic[] = [];

    // register the source content
    const fileKey = fileNameNormalizer(path);
    this._inputSource.set(fileKey, content);

    // get the source file
    const sourceFile = this.compilerHost.getSourceFile(
      path,
      this.overriddenCompilerOptions.target!,
    );

    // diagnostics
    if (diagnosticTypes.includes(DiagnosticTypes.global)) {
      diagnostics.push(...program.getGlobalDiagnostics());
    }
    if (diagnosticTypes.includes(DiagnosticTypes.options)) {
      diagnostics.push(...program.getOptionsDiagnostics());
    }
    if (diagnosticTypes.includes(DiagnosticTypes.syntactic)) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
    }
    if (diagnosticTypes.includes(DiagnosticTypes.semantic)) {
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile));
    }

    // finally triger the compilation
    program.emit(
      /*targetSourceFile*/ sourceFile,
      /*writeFile*/ undefined,
      /*cancellationToken*/ undefined,
      /*emitOnlyDtsFiles*/ undefined,
      this.transformers,
    );

    // get the generated source
    const transpiledSource = this._transpiledSource.get(fileKey);
    if (transpiledSource == null) {
      throw new Error(`[ts-jest] Output generation failed (file: ${path}).`);
    }

    // source maps are inlined
    return transpiledSource;
  }

  get transformers(): CustomTransformers {
    return {
      // before: [() => this.beforeTransformer],
    };
  }

  // @Memoize()
  // get beforeTransformer(): Transformer<SourceFile> {
  //   return (fileNode: SourceFile): SourceFile => {
  //     if (fileNode.isDeclarationFile) return fileNode;
  //     const nodeTransformer = (node: Node): Node => {
  //       return node;
  //     };
  //     fileNode.getChildAt(0).
  //   };
  // }

  reportDiagnostic(...diagnostics: Diagnostic[]) {
    const diagnostic = diagnostics[0];
    if (!diagnostic) return; // tslint:disable-line:curly

    const message = flattenDiagnosticMessageText(
      diagnostic.messageText,
      this.formatHost.getNewLine(),
    );
    throw new Error(`${diagnostic.code}: ${message}`);
  }
}
