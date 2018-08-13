import * as fakers from '../__helpers__/fakers';
import * as babelCfg from './babel-config';
import { BabelConfig } from '../types';

describe('extend', () => {
  let base!: BabelConfig;

  beforeEach(() => {
    base = fakers.babelConfig({
      presets: ['preset-1'],
      plugins: ['plugin-1'],
      minified: true,
    });
  });

  it('should be a copy', () => {
    const extended = babelCfg.extend(base);
    expect(extended).toEqual(base);
    expect(extended).not.toBe(base);
    expect(extended.presets).not.toBe(base.presets);
    expect(extended.plugins).not.toBe(base.plugins);
  });

  it('should extend correctly', () => {
    const extension: BabelConfig = {
      minified: false,
      envName: 'test',
      plugins: ['plugin-2'],
      presets: ['preset-2'],
    };
    const extended = babelCfg.extend(base, extension);
    expect(extended).not.toBe(base);
    expect(extended).not.toBe(extension);
    expect(extended.presets).not.toBe(base.presets);
    expect(extended.presets).not.toBe(extension.presets);
    expect(extended.plugins).not.toBe(base.plugins);
    expect(extended.plugins).not.toBe(extension.plugins);
    expect(extended).toMatchInlineSnapshot(`
Object {
  "envName": "test",
  "minified": false,
  "plugins": Array [
    "plugin-1",
    "plugin-2",
  ],
  "presets": Array [
    "preset-1",
    "preset-2",
  ],
}
`);
  });
});
