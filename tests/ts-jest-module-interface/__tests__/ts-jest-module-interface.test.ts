import * as tsJest from '../../..';

describe('ts-jest module interface', () => {
  it('is an object', () => {
    expect(typeof tsJest).toBe('object');
  });
  it('has a process function', () => {
    expect(typeof tsJest.process).toBe('function');
  });
  it('has a getCacheKey function', () => {
    expect(typeof tsJest.getCacheKey).toBe('function');
  });
  it('has a canInstrument property', () => {
    expect(tsJest).toHaveProperty('canInstrument', true);
  });
  it('has a createTransformer function', () => {
    expect(typeof tsJest.createTransformer).toBe('function');
  });
});
