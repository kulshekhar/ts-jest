/**
 * Postprocess step. Based on babel-jest: https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js
 * https://github.com/facebook/jest/blob/9b157c3a7c325c3971b2aabbe4c8ab4ce0b0c56d/packages/babel-jest/src/index.js
 */
import {
  BabelTransformOptions,
  PostProcessHook,
  TBabel,
  TBabelPluginIstanbul,
  TBabelPresetJest,
} from './types';
import { logOnce } from './utils/logger';
import getTSJestConfig from './utils/get-ts-jest-config';
import {
  importBabelCore,
  importBabelPluginIstanbul,
  importBabelPresetJest,
} from './utils/imports';
import { TransformOptions } from '@babel/core';

let babel: TBabel;
let istanbulPlugin: TBabelPluginIstanbul;
let jestPreset: TBabelPresetJest;

function importBabelDeps() {
  if (babel) return; // tslint:disable-line
  // we must use babel until we handle hoisting of jest.mock() internally
  babel = importBabelCore();

  // HACK: there is an issue still open in babel 6, this is a hack to bypass it
  // and fix our issue #627
  // Issue in babel: https://github.com/babel/babel/issues/6577
  if (babel.version && parseInt(babel.version.split('.')[0], 10) === 6) {
    const File = require('babel-core/lib/transformation/file/index.js').File;
    File.prototype.initOptions = (original => {
      return function(opt) {
        const before = opt.sourceMaps;
        const result = original.apply(this, arguments);
        if (opt.sourceMaps != null && opt.sourceMaps !== result.sourceMaps) {
          result.sourceMaps = opt.sourceMaps;
        }
        return result;
      };
    })(File.prototype.initOptions);
  }
  // end of HACK

  istanbulPlugin = importBabelPluginIstanbul();
  jestPreset = importBabelPresetJest();
}

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
  const presets = options.presets.slice();
  const plugins = options.plugins.slice();

  // adds babel-preset-jest if not present
  if (!hasBabelAddon(presets, jestPreset)) {
    presets.push(jestPreset);
  }

  // we need to know if there is istanbul plugin in the list so that we do not add it
  // in the case the user already has it configured
  const hasIstanbul = hasBabelAddon(plugins, istanbulPlugin);

  // create a new object we'll use as options with the sliced presets and plugins
  const optionsBase = { ...options, presets, plugins };

  delete optionsBase.cacheDirectory;

  const babelTransformer = (
    codeSourcemapPair: jest.TransformedSource,
    filename: string,
    config: jest.ProjectConfig,
    transformOptions: jest.TransformOptions,
  ): jest.TransformedSource => {
    const inputSourceMap =
      typeof codeSourcemapPair.map === 'string'
        ? JSON.parse(codeSourcemapPair.map)
        : codeSourcemapPair.map;
    const theseOptions = {
      ...optionsBase,
      filename,
      inputSourceMap,
    } as TransformOptions;
    if (transformOptions && transformOptions.instrument) {
      theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
      // Copied from jest-runtime transform.js
      if (!hasIstanbul) {
        theseOptions.plugins = [
          ...theseOptions.plugins,
          istanbulPluginConfig(config),
        ];
      }
    }

    // we typecast here because babel returns a more complete object than the one expected by jest
    return babel.transform(
      codeSourcemapPair.code,
      theseOptions,
    ) as jest.TransformedSource;
  };

  return babelTransformer;
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
    sourceMaps: tsJestConfig.disableSourceMapSupport ? false : 'both',
  };

  logOnce('Using babel with options:', babelOptions);

  return createBabelTransformer(babelOptions);
};

function toArray<T>(iter?: Iterable<T> | null): T[] {
  return iter ? Array.from(iter) : [];
}

function istanbulPluginConfig(jestConfig: jest.ProjectConfig) {
  return [
    istanbulPlugin,
    {
      // files outside `cwd` will not be instrumented
      cwd: jestConfig.rootDir,
      exclude: [],
    },
  ];
}

function hasBabelAddon(inputList: any[], ...addonMatches: any[]): boolean {
  return inputList.some(item => {
    return addonMatches.indexOf(Array.isArray(item) ? item[0] : item) !== -1;
  });
}
