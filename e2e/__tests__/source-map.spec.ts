import configureTestCase from '../__helpers__/test-case';

describe('Source maps', () => {
  it('should report correct line numbers with console.log', () => {
    const testCase = configureTestCase('source-maps', { args: ['--no-cache'] });
    const result = testCase.runWithTemplates(
      0,
      'default',
      'with-babel-7',
      'with-jest-22',
    );
    expect(result).toMatchSnapshot();
  });

  it('should report correct line numbers when failing', () => {
    const testCase = configureTestCase('source-maps', {
      env: { __FORCE_FAIL: '1' },
    });
    const result = testCase.runWithTemplates(
      1,
      'default',
      'with-babel-7',
      'with-jest-22',
    );
    expect(result).toMatchSnapshot();
  });
});
