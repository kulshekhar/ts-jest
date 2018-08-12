import TsJestTransformer from './ts-jest-transformer';

// TODO: allow a `TsJestGlobalOptions` object to be give to createTransformer()
// so that presets could totally customize and extend the transfomer;
let transformer: jest.Transformer;
function createTransformer() {
  return (transformer = new TsJestTransformer());
}
function tsProcess(...args: any[]): any {
  return (createTransformer() as any).process(...args);
}
function getCacheKey(...args: any[]): any {
  return (createTransformer() as any).getCacheKey(...args);
}

export { createTransformer, tsProcess as process, getCacheKey };
