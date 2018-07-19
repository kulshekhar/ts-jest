import { TransformOptions as BabelTransformOpts } from 'babel-core';

export interface TransformOptions {
  instrument: boolean;
}

export type Path = string;

export type Glob = string;

export interface ConfigGlobals {
  [key: string]: any;
}

export interface HasteConfig {
  defaultPlatform?: string | null;
  hasteImplModulePath?: string;
  platforms?: string[];
  providesModuleNodeModules: string[];
}

export interface BabelTransformOptions extends BabelTransformOpts {
  cacheDirectory?: string;
}

export type PostProcessHook = (
  codeSourcemapPair: CodeSourceMapPair,
  filePath: string,
  config: JestConfig,
  transformOptions: TransformOptions,
) => CodeSourceMapPair;

export type JestConfig = jest.InitialOptions & {
  globals?: jest.ConfigGlobals & {
    __TRANSFORM_HTML__?: boolean;
  };
};

export interface TsJestConfig {
  babelConfig?: BabelTransformOpts;
  disableSourceMapSupport?: boolean;
  enableInternalCache?: boolean;
  enableTsDiagnostics?: boolean;
  ignoreCoverageForAllDecorators?: boolean;
  ignoreCoverageForDecorators?: boolean;
  skipBabel?: boolean;
  tsConfigFile?: string;
  useBabelrc?: boolean;
  useExperimentalLanguageServer?: boolean;
}

export interface JestConfigNormalize {
  hasDeprecationWarnings: boolean;
  options: jest.DefaultOptions;
}

export interface CodeSourceMapPair {
  code: string;
  map: string;
}
