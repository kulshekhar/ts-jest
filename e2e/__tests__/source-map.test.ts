import { configureTestCase } from '../__helpers__/test-case';
import { allPackageSets } from '../__helpers__/templates';

describe('console.log()', () => {
  const testCase = configureTestCase('source-maps', { args: ['--no-cache'] });

  testCase.runWithTemplates(allPackageSets, 0, (runTest, { templateName }) => {
    it(`should pass reporting correct line number using template "${templateName}"`, () => {
      const result = runTest();
      expect(result.status).toBe(0);
      expect(result).toMatchSnapshot();
    });
  });
});

describe('throw new Error()', () => {
  const testCase = configureTestCase('source-maps', {
    args: ['--no-cache'],
    env: { __FORCE_FAIL: '1' },
  });

  testCase.runWithTemplates(allPackageSets, 1, (runTest, { templateName }) => {
    it(`should fail reporting correct line number using template "${templateName}"`, () => {
      const result = runTest();
      expect(result.status).toBe(1);
      expect(result).toMatchSnapshot();
    });
  });
});

// when there are some issues with debugging, it's usually becasue source mpas are not inlined
// and the debugger cannot find the line where to go
describe('debugging', () => {
  // tslint:disable-next-line:max-line-length
  const testCase = configureTestCase('source-maps', {
    args: ['--no-cache'],
    writeIo: true,
  });
  testCase.runWithTemplates(allPackageSets, 0, (runTest, { templateName }) => {
    it(`should include special comment when using template "${templateName}"`, () => {
      const result = runTest();
      expect(result.status).toBe(0);
      expect(result.ioDataFor('echo.ts').out).toMatchSnapshot();
    });
  });
});
