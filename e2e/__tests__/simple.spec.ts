import configureTestCase from '../__helpers__/test-case';

describe('Simple test', () => {
  it('should pass with each template', () => {
    const testCase = configureTestCase('simple', { args: ['--no-cache'] });
    const result = testCase.runWithTemplates(
      0,
      'default',
      'with-babel-7',
      'with-jest-22',
    );
    expect(result).toMatchSnapshot();
  });
});
