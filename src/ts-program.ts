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
  createWatchCompilerHost,
  createSemanticDiagnosticsBuilderProgram,
  WatchCompilerHost,
  SemanticDiagnosticsBuilderProgram,
  TranspileOptions,
  ModuleKind,
  transpileModule,
} from 'typescript';
import { relative, sep, resolve, dirname } from 'path';
import { existsSync } from 'fs';

export default class TsProgram {
  constructor(
    readonly rootDir: string,
    readonly tsJestConfig: TsJestGlobalOptions = {},
  ) {}

  private _formatHost!: FormatDiagnosticsHost;
  get formatHost(): FormatDiagnosticsHost {
    if (!this._formatHost !== undefined) return this._formatHost; // tslint:disable-line:curly

    if (this._formatHost === undefined) {
      this._formatHost = {
        getCanonicalFileName: path => relative(this.rootDir, path),
        getCurrentDirectory: () => this.rootDir,
        getNewLine: () => sys.newLine,
      };
    }
    return this._formatHost;
  }

  private _configFile!: string;
  get configFile(): string | null {
    if (this._configFile !== undefined) return this._configFile; // tslint:disable-line:curly

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
      return (this._configFile = null);
    }
    // could we find one?
    if (!resolved) {
      throw new Error(`Could not find a TS config file.`);
    }
    return (this._configFile = resolved);
  }

  private _compilerOptions!: CompilerOptions;
  get compilerOptions() {
    if (this._compilerOptions !== undefined) return this._compilerOptions; // tslint:disable-line:curly

    const { configFile } = this;
    if (configFile == null) {
      // if it's null it means it's not a file but directly some compiler options
      return (this._compilerOptions = this.tsJestConfig
        .tsConfig as CompilerOptions);
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

    return (this._compilerOptions = options);
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

  private _watchCompilerHost!: WatchCompilerHost<
    SemanticDiagnosticsBuilderProgram
  >;
  get watchCompilerHost(): WatchCompilerHost<
    SemanticDiagnosticsBuilderProgram
  > {
    if (this._watchCompilerHost !== undefined) {
      return this._watchCompilerHost;
    }

    const compiler = createWatchCompilerHost(
      [],
      this.compilerOptions,
      sys,
      createSemanticDiagnosticsBuilderProgram,
      this.reportDiagnostic.bind(this),
    );
    return (this._watchCompilerHost = compiler);
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
