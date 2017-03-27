import {process} from '../../src/preprocessor';

const source =
`<div class="html-test">
  <span class="html-test__element">This is element</span>
</div>`;
const path = '/path/to/file.html';
const config = {
  globals: {
    __TRANSFORM_HTML__: true
  },
  transform: {
    ".(ts|tsx|html)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
  },
  testRegex: "/specs/.*\\.spec\\.(ts|tsx|js)$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ]
};

test('transforms html if config.globals.__TRANSFORM_HTML__ is set', () => {
  expect(process(source, path, config)).toMatchSnapshot();
  delete config.globals.__TRANSFORM_HTML__;
  expect(process(source, path, config)).toMatchSnapshot();
});
