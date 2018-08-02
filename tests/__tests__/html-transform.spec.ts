import * as tsJest from '../../dist';
import mockJestConfig from '../__helpers__/mock-jest-config';

const TEST_CASE = 'simple';
const FILENAME = 'some-file.html';

const fileContent = `<div class="html-test">
  <span class="html-test__element">This is element</span>
  <code>This is a backtilt \`</code>
</div>`;

describe('Html transforms', () => {
  it('transforms html if config.globals.__TRANSFORM_HTML__ is set', () => {
    let jestConfig;

    // get the untransformed version
    jestConfig = mockJestConfig(TEST_CASE);
    const untransformed = tsJest.process(
      fileContent,
      `${jestConfig.rootDir}/${FILENAME}`,
      jestConfig,
    );
    expect(untransformed).toBe(fileContent);
    expect(untransformed).toMatchSnapshot('untransformed');

    // ... then the one which should be transformed
    jestConfig = {
      ...mockJestConfig(TEST_CASE),
      globals: { __TRANSFORM_HTML__: true },
    };
    const transformed = tsJest.process(
      fileContent,
      `${jestConfig.rootDir}/${FILENAME}`,
      jestConfig,
    ) as string;
    expect(transformed).not.toBe(fileContent);
    expect(transformed).toMatchSnapshot('source');

    // ... finally the result of a `require('module-with-transformed-version')`
    const value = eval(
      `(function(){const module={}; ${transformed}; return module.exports;})()`,
    );
    expect(value).toMatchSnapshot('module');
    // the value should be the same string as the source version
    expect(value).toBe(fileContent);
  });
});
