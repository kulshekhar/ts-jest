// tslint:disable:member-ordering
import { TsJestConfig, TsJestProgram } from './types';
import { sep, resolve, dirname, basename } from 'path';
import { existsSync, readFileSync } from 'fs';
import Memoize from './utils/memoize';
import hoisting from './transformers/hoisting';
import { interpolate, Errors, ImportReasons } from './utils/messages';
import importer from './utils/importer';
// take care of including ONLY TYPES here, for the rest use ts
import {
  CompilerOptions,
  ParsedCommandLine,
  ParseConfigHost,
  CustomTransformers,
  TransformerFactory,
  SourceFile,
  TranspileOptions,
  Diagnostic,
} from 'typescript';

const ts = importer.typeScript(ImportReasons.tsJest);
const { sys } = ts;

export const compilerOptionsOverrides: Readonly<CompilerOptions> = {
  // ts-jest
  module: ts.ModuleKind.CommonJS,
  esModuleInterop: true,
  inlineSources: false,
  sourceMap: false,
  inlineSourceMap: true,
};

export default class TsProgram implements TsJestProgram {
  constructor(readonly rootDir: string, readonly tsJestConfig: TsJestConfig) {}

  @Memoize()
  get configFile(): string | null {
    const given = this.tsJestConfig.tsConfig;
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
      resolved = ts.findConfigFile(
        this.rootDir,
        sys.fileExists,
        'tsconfig.json',
      );
    } else {
      // what we got was compiler options
      return null;
    }
    // could we find one?
    if (!resolved) {
      throw new Error(
        interpolate(Errors.UnableToFindTsConfig, { given, root: this.rootDir }),
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
      ? ts.readConfigFile(configFile, sys.readFile)
      : {
          config: { compilerOptions: this.tsJestConfig.tsConfig },
          error: undefined,
        };
    if (error) throw error; // tslint:disable-line:curly

    const parseConfigHost: ParseConfigHost = {
      fileExists: existsSync,
      readDirectory: sys.readDirectory,
      readFile: file => readFileSync(file, 'utf8'),
      useCaseSensitiveFileNames: true,
    };

    const result = ts.parseJsonConfigFileContent(
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

  @Memoize()
  get transformers(): CustomTransformers {
    // https://dev.doctorevidence.com/how-to-write-a-typescript-transform-plugin-fc5308fdd943
    const before: Array<TransformerFactory<SourceFile>> = [];
    const after: Array<TransformerFactory<SourceFile>> = [];

    // no babel-jest, we need to handle the hoisting
    if (!this.tsJestConfig.babelJest) {
      before.push(hoisting(this));
    }

    return {
      before,
      after,
    };
  }

  transpileModule(
    path: string,
    content: string,
    instrument: boolean = false,
    extraCompilerOptions?: CompilerOptions,
  ): string {
    const options: TranspileOptions = {
      fileName: path,
      reportDiagnostics: false,
      transformers: this.transformers,
      compilerOptions: {
        ...this.overriddenCompilerOptions,
        ...extraCompilerOptions,
      },
    };
    const { diagnostics, outputText } = ts.transpileModule(content, options);

    this.reportDiagnostic(...diagnostics);

    // outputText will contain inline sourmaps
    return outputText;
  }

  reportDiagnostic(...diagnostics: Diagnostic[]) {
    const diagnostic = diagnostics[0];
    if (!diagnostic) return; // tslint:disable-line:curly

    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      sys.newLine,
    );
    throw new Error(`${diagnostic.code}: ${message}`);
  }
}
