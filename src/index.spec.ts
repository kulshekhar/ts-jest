import * as tsJest from './index';

describe('ts-jest', () => {
  it('should export a `createTransformer` function', () => {
    expect(typeof tsJest.createTransformer).toBe('function');
  });
  it('should export a `process` function', () => {
    expect(typeof tsJest.process).toBe('function');
  });
  it('should export a `getCacheKey` function', () => {
    expect(typeof tsJest.getCacheKey).toBe('function');
  });
  it('should export a `jestPreset` object', () => {
    expect(typeof tsJest.jestPreset).toBe('object');
  });
});
