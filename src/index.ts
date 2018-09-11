import { flushLogs } from './utils/logger';
import getCacheKey from './utils/get-cache-key';
import preprocess from './preprocess';

const createTransformer = (options?: any): jest.Transformer => {
  // options are always empty, must be the older jest API giving options here
  return {
    canInstrument: true,
    getCacheKey,
    process: (...args) => {
      try {
        return preprocess(...args);
      } finally {
        flushLogs();
      }
    },
    createTransformer: undefined as any,
  };
};

const mod = createTransformer();
mod.createTransformer = createTransformer;
export = mod;
