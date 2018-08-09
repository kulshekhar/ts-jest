import configureTestCase, {
  withTemplatesIterator,
} from '../__helpers__/test-case';
import { allPackageSets } from '../__helpers__/templates';

describe('Source maps', () => {
  describe('console.log()', () => {
    const testCase = configureTestCase('source-maps', { args: ['--no-cache'] });

    testCase.runWithTemplates(allPackageSets, {
      iterator: withTemplatesIterator({
        it: 'should pass reporting correct line number',
      }),
      logUnlessStatus: 0,
    });
  });

  describe('throw new Error()', () => {
    const testCase = configureTestCase('source-maps', {
      args: ['--no-cache'],
      env: { __FORCE_FAIL: '1' },
    });

    testCase.runWithTemplates(allPackageSets, {
      iterator: withTemplatesIterator({
        it: 'should fail reporting correct line number',
      }),
      logUnlessStatus: 1,
    });
  });
});
