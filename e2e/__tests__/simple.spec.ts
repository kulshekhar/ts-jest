import configureTestCase, {
  withTemplatesIterator,
} from '../__helpers__/test-case';
import { allPackageSets } from '../__helpers__/templates';

describe('Simple test', () => {
  const testCase = configureTestCase('simple', { args: ['--no-cache'] });

  testCase.runWithTemplates(allPackageSets, {
    logUnlessStatus: 0,
    iterator: withTemplatesIterator({ it: 'should pass' }),
  });
});
