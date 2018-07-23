import { TransformOptions as BabelTransformOpts } from 'babel-core';

export interface JestCacheKeyOptions {
  rootDir: string;
  instrument: boolean;
}

export interface TsJestContext {
  cache: any;
  options: any;
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
  codeSourcemapPair: jest.TransformedSource,
  filePath: string,
  config: jest.ProjectConfig,
  transformOptions: jest.TransformOptions,
) => jest.TransformedSource;

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
