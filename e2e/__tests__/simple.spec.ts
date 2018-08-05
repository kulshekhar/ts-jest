import configureTestCase from '../__helpers__/test-case';

describe('Simple e2e test', () => {
  it('should pass with babel 6', () => {
    const testCase = configureTestCase('simple');
    expect(testCase.run(0).status).toBe(0);
  });
  it('should pass with babel 7', () => {
    const testCase = configureTestCase('simple', { template: 'with-babel-7' });
    expect(testCase.run(0).status).toBe(0);
  });
});
