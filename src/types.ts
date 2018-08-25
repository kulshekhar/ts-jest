import { TransformOptions as BabelTransformOpts } from 'babel-core';

import * as _babel from '@babel/core';
import * as _babelEnv from '@babel/preset-env';
import * as _babelJest from 'babel-preset-jest';
import _babelIstanbul from 'babel-plugin-istanbul';

export type TBabel = typeof _babel;
export type TBabelPluginIstanbul = typeof _babelIstanbul;
export type TBabelPresetEnv = typeof _babelEnv;
export type TBabelPresetJest = typeof _babelJest;

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
  compiler?: string;
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
