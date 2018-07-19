// structure of this file heavilly inspired on:
// https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js

import jestPreset from 'babel-preset-jest';
import getCacheKeyForArgs from './utils/get-cache-key';
import { TsJestContext, JestCacheKeyArguments } from './types';
import preprocess from './preprocess';

const createTransformer = (options?: any): jest.Transformer => {
  const cache = Object.create(null);

  options = Object.assign({}, options, {
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat([jestPreset]),
    sourceMaps: 'both',
  });
  delete options.cacheDirectory;
  delete options.filename;

  const context: TsJestContext = { cache, options };

  const getCacheKey = (...args: any[]) =>
    getCacheKeyForArgs(args as JestCacheKeyArguments, context);

  return {
    canInstrument: true,
    getCacheKey,
    process: preprocess,
    createTransformer: undefined as any,
  };
};

const mod = createTransformer();
mod.createTransformer = createTransformer;
export = mod;
