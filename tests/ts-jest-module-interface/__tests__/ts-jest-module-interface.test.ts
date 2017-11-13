import * as tsJest from 'ts-jest';

describe('ts-jest module interface', () => {
  it('is an object', () => {
    expect(typeof tsJest).toBe('object');
  });
  it('has a process function', () => {
    expect(typeof tsJest.process).toBe('function');
  });
  it('has an install function', () => {
    expect(typeof tsJest.install).toBe('function');
  });
  it('has a getCacheKey function', () => {
    expect(typeof tsJest.getCacheKey).toBe('function');
  });
});
