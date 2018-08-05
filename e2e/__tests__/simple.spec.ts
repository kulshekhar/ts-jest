import testCase from '../__helpers__/test-case';

describe('Simple e2e test', () => {
  it('should pass with babel 6', () => {
    expect(testCase('simple')).toRunWithExitCode(0);
  });
  it('should pass with babel 7', () => {
    expect(testCase('simple', { template: 'with-babel-7' })).toRunWithExitCode(
      0,
    );
  });
});
