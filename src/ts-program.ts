// tslint:disable:member-ordering
import { TsJestGlobalOptions } from './types';
import {
  FormatDiagnosticsHost,
  sys,
  findConfigFile,
  CompilerOptions,
  Diagnostic,
  flattenDiagnosticMessageText,
  readConfigFile,
  parseJsonConfigFileContent,
  TranspileOptions,
  ModuleKind,
  transpileModule,
} from 'typescript';
import { relative, sep, resolve, dirname } from 'path';
import { existsSync } from 'fs';
import Memoize from './memoize';

export default class TsProgram {
  constructor(
    readonly rootDir: string,
    readonly tsJestConfig: TsJestGlobalOptions = {},
  ) {}

  @Memoize()
  get formatHost(): FormatDiagnosticsHost {
    return {
      getCanonicalFileName: path => relative(this.rootDir, path),
      getCurrentDirectory: () => this.rootDir,
      getNewLine: () => sys.newLine,
    };
  }

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
  get compilerOptions() {
    const { configFile } = this;
    if (configFile == null) {
      // if it's null it means it's not a file but directly some compiler options
      return this.tsJestConfig.tsConfig as CompilerOptions;
    }
    const { config, error } = readConfigFile(configFile, sys.readFile);
    if (error) throw error; // tslint:disable-line:curly
    const { errors, options } = parseJsonConfigFileContent(
      config,
      sys,
      dirname(configFile),
      undefined,
      configFile,
    );

    // will throw if at least one error
    this.reportDiagnostic(...errors);

    return options;
  }

  transpileModule(
    path: string,
    content: string,
    instrument: boolean = false,
  ): string {
    const compilerOptions: CompilerOptions = {
      ...this.compilerOptions,
      module: ModuleKind.CommonJS,
      esModuleInterop: true,
      inlineSources: false,
      sourceMap: false,
      inlineSourceMap: true,
    };
    const options: TranspileOptions = {
      fileName: path,
      reportDiagnostics: false, // TODO: make this an option
      // transformers: {}, // TODO: use this to hie decorators and such
      compilerOptions,
    };
    const { diagnostics, outputText } = transpileModule(content, options);
    // TODO: handle diagnostics
    this.reportDiagnostic(...diagnostics);

    // outputText will contain inline sourmaps
    return outputText;
  }

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
