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
  FullJestConfig,
  JestConfig,
  PostProcessHook,
  TransformOptions,
  TsJestConfig,
} from './jest-types';
import { logOnce } from './logger';

// Function that takes the transpiled typescript and runs it through babel/whatever.
export function postProcessCode(
  compilerOptions: CompilerOptions,
  jestConfig: JestConfig,
  tsJestConfig: TsJestConfig,
  transformOptions: TransformOptions,
  transpiledText: string,
  filePath: string,
): string {
  const postHook = getPostProcessHook(
    compilerOptions,
    jestConfig,
    tsJestConfig,
  );

  return postHook(transpiledText, filePath, jestConfig, transformOptions);
}

function createBabelTransformer(
  options: BabelTransformOptions,
): PostProcessHook {
  importBabelDeps();
  options = {
    ...options,
    plugins: options.plugins || [],
    presets: (options.presets || []).concat([jestPreset]),
    // If retainLines isn't set to true, the line numbers
    // are off by 1
    retainLines: true,
    // force the sourceMaps property to be 'inline' during testing
    // to help generate accurate sourcemaps.
    sourceMaps: 'inline',
  };
  delete options.cacheDirectory;
  delete options.filename;

  return (
    src: string,
    filename: string,
    config: JestConfig,
    transformOptions: TransformOptions,
  ): string => {
    const theseOptions = Object.assign({ filename }, options);
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

    return babel.transform(src, theseOptions).code;
  };
}

export const getPostProcessHook = (
  tsCompilerOptions: CompilerOptions,
  jestConfig: JestConfig,
  tsJestConfig: TsJestConfig,
): PostProcessHook => {
  if (tsJestConfig.skipBabel) {
    logOnce('Not using any postprocess hook.');
    return src => src; // Identity function
  }

  const plugins = Array.from(
    (tsJestConfig.babelConfig && tsJestConfig.babelConfig.plugins) || [],
  );
  // If we're not skipping babel
  if (tsCompilerOptions.allowSyntheticDefaultImports) {
    plugins.push('transform-es2015-modules-commonjs');
  }

  const babelOptions = {
    ...tsJestConfig.babelConfig,
    babelrc: tsJestConfig.useBabelrc || false,
    plugins,
    presets: tsJestConfig.babelConfig ? tsJestConfig.babelConfig.presets : [],
  };

  logOnce('Using babel with options:', babelOptions);

  return createBabelTransformer(babelOptions);
};
