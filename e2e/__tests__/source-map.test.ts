import { configureTestCase } from '../__helpers__/test-case';
import { allPackageSets } from '../__helpers__/templates';

describe('Source maps', () => {
  describe('console.log()', () => {
    const testCase = configureTestCase('source-maps', { args: ['--no-cache'] });

    testCase.runWithTemplates(
      allPackageSets,
      0,
      (runTest, { describeLabel }) => {
        describe(describeLabel, () => {
          it('should pass reporting correct line number', () => {
            const result = runTest();
            expect(result.status).toBe(0);
            expect(result).toMatchSnapshot();
          });
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
      (runTest, { describeLabel }) => {
        describe(describeLabel, () => {
          it('should fail reporting correct line number', () => {
            const result = runTest();
            expect(result.status).toBe(1);
            expect(result).toMatchSnapshot();
          });
        });
      },
    );
  });
});
