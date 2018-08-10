import { configureTestCase } from '../__helpers__/test-case';
import { allPackageSets } from '../__helpers__/templates';

describe('Source maps', () => {
  describe('console.log()', () => {
    const testCase = configureTestCase('source-maps', { args: ['--no-cache'] });

    testCase.runWithTemplates(
      allPackageSets,
      0,
      (runTest, { templateName }) => {
        it(`should pass reporting correct line number using template "${templateName}"`, () => {
          const result = runTest();
          expect(result.status).toBe(0);
          expect(result).toMatchSnapshot();
        });
      },
    );
  });

  describe('throw new Error()', () => {
    const testCase = configureTestCase('source-maps', {
      args: ['--no-cache'],
      env: { __FORCE_FAIL: '1' },
    });

    testCase.runWithTemplates(
      allPackageSets,
      1,
      (runTest, { templateName }) => {
        it(`should fail reporting correct line number using template "${templateName}"`, () => {
          const result = runTest();
          expect(result.status).toBe(1);
          expect(result).toMatchSnapshot();
        });
      },
    );
  });
});
