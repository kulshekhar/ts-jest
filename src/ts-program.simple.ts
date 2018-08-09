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
  TranspileOptions,
  transpileModule,
} from 'typescript';
import { sep, resolve, dirname, basename } from 'path';
import { existsSync, readFileSync } from 'fs';
import Memoize from './memoize';
import fileExtension from './utils/file-extension';
import { fixupCompilerOptions } from './utils/ts-internals';

export const compilerOptionsOverrides: Readonly<CompilerOptions> = {
  // ts-jest
  module: ModuleKind.CommonJS,
  esModuleInterop: true,
  inlineSources: false,
  sourceMap: false,
  inlineSourceMap: true,
};

export default class TsProgram {
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

  transpileModule(
    path: string,
    content: string,
    instrument: boolean = false,
  ): string {
    const options: TranspileOptions = {
      fileName: path,
      reportDiagnostics: false,
      transformers: this.transformers,
      compilerOptions: { ...this.overriddenCompilerOptions },
    };
    const { diagnostics, outputText } = transpileModule(content, options);

    this.reportDiagnostic(...diagnostics);

    // outputText will contain inline sourmaps
    return outputText;
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
