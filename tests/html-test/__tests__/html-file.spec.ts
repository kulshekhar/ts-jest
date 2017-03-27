import {process} from '../../../preprocessor';
const config = require('../package.json');

test('html to be transformed', () => {
  const source =
`<div class="html-test">
  <span class="html-test__element">This is element</span>
</div>`;
  const path = '/path/to/file.html';

  expect(process(source, path, config.jest)).toMatchSnapshot();
});
