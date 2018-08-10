import { configureTestCase } from '../__helpers__/test-case';
import { allPackageSets } from '../__helpers__/templates';

describe('Hoisting test', () => {
  const testCase = configureTestCase('hoisting', { args: ['--no-cache'] });

  testCase.runWithTemplates(allPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest();
      expect(result.status).toBe(0);
      expect(result).toMatchSnapshot();
    });
  });
});
