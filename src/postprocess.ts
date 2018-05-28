/**
 * Postprocess step. Based on babel-jest: https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js
 * https://github.com/facebook/jest/blob/9b157c3a7c325c3971b2aabbe4c8ab4ce0b0c56d/packages/babel-jest/src/index.js
 */
import * as __types__babel from 'babel-core';
import __types__istanbulPlugin from 'babel-plugin-istanbul';
import * as __types__jestPreset from 'babel-preset-jest';
import * as ts from 'typescript';
let babel: typeof __types__babel;
let istanbulPlugin: typeof __types__istanbulPlugin;
let jestPreset: typeof __types__jestPreset;
function importBabelDeps() {
  if (babel) {
    return;
  }
  babel = require('babel-core');
  istanbulPlugin = require('babel-plugin-istanbul').default;
  jestPreset = require('babel-preset-jest');
}
import { CompilerOptions } from 'typescript/lib/typescript';
import {
  BabelTransformOptions,
  CodeSourceMapPair,
  FullJestConfig,
  JestConfig,
  PostProcessHook,
  TransformOptions,
  TsJestConfig,
} from './jest-types';
import { logOnce } from './logger';
import { BabelFileResult } from 'babel-core';

// Function that takes the transpiled typescript and runs it through babel/whatever.
export function postProcessCode(
  compilerOptions: CompilerOptions,
  jestConfig: JestConfig,
  tsJestConfig: TsJestConfig,
  transformOptions: TransformOptions,
  transpileOutput: CodeSourceMapPair,
  filePath: string,
): CodeSourceMapPair {
  const postHook = getPostProcessHook(
    compilerOptions,
    jestConfig,
    tsJestConfig,
  );

  return postHook(transpileOutput, filePath, jestConfig, transformOptions);
}

function createBabelTransformer(
  options: BabelTransformOptions,
): PostProcessHook {
  importBabelDeps();
  options = {
    ...options,
    plugins: options.plugins || [],
    presets: (options.presets || []).concat([jestPreset]),
  };
  delete options.cacheDirectory;
  delete options.filename;

  return (
    codeSourcemapPair: CodeSourceMapPair,
    filename: string,
    config: JestConfig,
    transformOptions: TransformOptions,
  ): CodeSourceMapPair => {
    const theseOptions = Object.assign(
      { filename, inputSourceMap: codeSourcemapPair.map },
      options,
    );
    if (transformOptions && transformOptions.instrument) {
      theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
      // Copied from jest-runtime transform.js
      theseOptions.plugins = theseOptions.plugins.concat([
        [
          istanbulPlugin,
          {
            // files outside `cwd` will not be instrumented
            cwd: config.rootDir,
            exclude: [],
          },
        ],
      ]);
    }
    // Babel has incorrect typings, where the map is an object instead of a string. So we have to typecast it here
    return (babel.transform(
      codeSourcemapPair.code,
      theseOptions,
    ) as any) as CodeSourceMapPair;
  };
}

export const getPostProcessHook = (
  tsCompilerOptions: CompilerOptions,
  jestConfig: JestConfig,
  tsJestConfig: TsJestConfig,
): PostProcessHook => {
  if (tsJestConfig.skipBabel) {
    logOnce('Not using any postprocess hook.');
    // Identity function
    return input => input;
  }

  const plugins = Array.from(
    (tsJestConfig.babelConfig && tsJestConfig.babelConfig.plugins) || [],
  );

  const babelOptions: BabelTransformOptions = {
    ...tsJestConfig.babelConfig,
    babelrc: tsJestConfig.useBabelrc || false,
    plugins,
    presets: tsJestConfig.babelConfig ? tsJestConfig.babelConfig.presets : [],
    sourceMaps: tsJestConfig.disableSourceMapSupport !== true,
  };

  logOnce('Using babel with options:', babelOptions);

  return createBabelTransformer(babelOptions);
};
