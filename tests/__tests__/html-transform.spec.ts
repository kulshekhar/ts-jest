import * as tsJest from '../..';

const path = '/path/to/file.html';
const config: jest.ProjectConfig = { globals: {} } as any;
// wrap a transformed source so that we can fake a `require()` on it by calling the returned wrapper
const wrap = (src: string) =>
  new Function(`var module={}; ${src} return module.exports;`) as any;

const source = `<div class="html-test">
  <span class="html-test__element">This is element</span>
  <code>This is a backtilt \`</code>
</div>`;

describe('Html transforms', () => {
  it('transforms html if config.globals.__TRANSFORM_HTML__ is set', () => {
    // get the untransformed version
    const untransformed = tsJest.process(source, path, config);
    // ... then the one which should be transformed
    (config.globals as any).__TRANSFORM_HTML__ = true;
    const transformed = tsJest.process(source, path, config) as string;
    // ... finally the result of a `require('module-with-transformed-version')`
    const exported = wrap(transformed)();

    expect(exported).toMatchSnapshot('module');
    expect(transformed).toMatchSnapshot('source');
    expect(untransformed).toMatchSnapshot('untransformed');
    // requiring the transformed version should return the same string as the untransformed version
    expect(exported).toBe(untransformed);
  });
});
