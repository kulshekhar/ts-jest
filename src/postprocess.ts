/**
 * Postprocess step. Based on babel-jest: https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js
 * https://github.com/facebook/jest/blob/9b157c3a7c325c3971b2aabbe4c8ab4ce0b0c56d/packages/babel-jest/src/index.js
 */
import * as __types__babel from 'babel-core';
import __types__istanbulPlugin from 'babel-plugin-istanbul';
import * as __types__jestPreset from 'babel-preset-jest';
let babel: typeof __types__babel;
let istanbulPlugin: typeof __types__istanbulPlugin;
let jestPreset: typeof __types__jestPreset;
function importBabelDeps() {
  if (babel) return; // tslint:disable-line
  // ensure we use the require from jest
  babel = require.main.require('@babel/core');
  istanbulPlugin = require.main.require('babel-plugin-istanbul').default;
  jestPreset = require.main.require('babel-preset-jest');
}
import {
  BabelTransformOptions,
  PostProcessHook,
  JestCacheKeyOptions,
} from './types';
import { logOnce } from './utils/logger';
import getTSJestConfig from './utils/get-ts-jest-config';

// Function that takes the transpiled typescript and runs it through babel/whatever.
export function postProcessCode(
  jestConfig: jest.ProjectConfig,
  transformOptions: jest.TransformOptions,
  transpileOutput: jest.TransformedSource,
  filePath: string,
): jest.TransformedSource {
  const postHook = getPostProcessHook(jestConfig);

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
    codeSourcemapPair: jest.TransformedSource,
    filename: string,
    config: jest.ProjectConfig,
    transformOptions: JestCacheKeyOptions,
  ): jest.TransformedSource => {
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

    // we typecast here because babel returns a more complete object than the one expected by jest
    return babel.transform(
      codeSourcemapPair.code,
      theseOptions,
    ) as jest.TransformedSource;
  };
}

export const getPostProcessHook = (
  jestConfig: jest.ProjectConfig,
): PostProcessHook => {
  const tsJestConfig = getTSJestConfig(jestConfig);
  if (tsJestConfig.skipBabel) {
    logOnce('Not using any postprocess hook.');
    // Identity function
    return input => input;
  }

  const tsJestBabelConfig = tsJestConfig.babelConfig || {};
  const babelOptions: BabelTransformOptions = {
    ...tsJestBabelConfig,
    babelrc: tsJestConfig.useBabelrc || false,
    plugins: toArray(tsJestBabelConfig.plugins),
    presets: toArray(tsJestBabelConfig.presets),
    sourceMaps: !tsJestConfig.disableSourceMapSupport,
  };

  logOnce('Using babel with options:', babelOptions);

  return createBabelTransformer(babelOptions);
};

function toArray<T>(iter?: Iterable<T> | null): T[] {
  return iter ? Array.from(iter) : [];
}
