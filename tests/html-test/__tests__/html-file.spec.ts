import {process} from '../../../preprocessor';
const config = require('../package.json');

test('transforms html if config.globals.__TRANSFORM_HTML__ is set', () => {
  const source =
`<div class="html-test">
  <span class="html-test__element">This is element</span>
</div>`;
  const path = '/path/to/file.html';

  expect(process(source, path, config.jest)).toMatchSnapshot();
  delete config.jest.globals.__TRANSFORM_HTML__;
  expect(process(source, path, config.jest)).toMatchSnapshot();
});
