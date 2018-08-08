import configureTestCase from '../__helpers__/test-case';

describe('Simple test', () => {
  it('should pass with babel 6', () => {
    const testCase = configureTestCase('simple');
    expect(testCase.run(0).status).toBe(0);
  });
  it('should pass with babel 7', () => {
    const testCase = configureTestCase('simple', { template: 'with-babel-7' });
    expect(testCase.run(0).status).toBe(0);
  });
  it('should pass with jest 22', () => {
    const testCase = configureTestCase('simple', { template: 'with-jest-22' });
    expect(testCase.run(0).status).toBe(0);
  });
});
