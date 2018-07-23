import getCacheKey from './utils/get-cache-key';
import preprocess from './preprocess';

//FIXME: options is always empty
const createTransformer = (options?: any): jest.Transformer => {
  // const cache = Object.create(null);
  // options = Object.assign({}, options, {
  //   compact: false,
  //   plugins: (options && options.plugins) || [],
  //   presets: ((options && options.presets) || []).concat([jestPreset]),
  //   sourceMaps: 'both',
  // });
  // delete options.cacheDirectory;
  // delete options.filename;

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
