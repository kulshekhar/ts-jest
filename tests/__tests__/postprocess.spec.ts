jest.mock('babel-core', () => {
  return {
    transform: jest.fn(() => {
      return { code: 'stubbed_code', map: 'stubbed_map' };
    }),
  };
});

import { getPostProcessHook } from '../../src/postprocess';

describe('postprocess', () => {
  function runHook(tsCompilerOptions = {}, jestConfig = {}, tsJestConfig = {}) {
    return getPostProcessHook(tsCompilerOptions, jestConfig, tsJestConfig)(
      { code: 'input_code', map: 'input_source_map' },
      'fake_file',
      {},
      { instrument: null },
    );
  }

  it('skips postprocess when skipBabel=true', () => {
    const transformMock = require.requireMock('babel-core').transform;

    runHook({}, {}, { skipBabel: true });
    expect(transformMock).not.toBeCalled();
  });

  it('skips commonjs module transform by default', () => {
    const transformMock = require.requireMock('babel-core').transform;

    runHook();
    getPostProcessHook({}, {}, {})(
      { code: 'input_code', map: 'input_source_map' },
      'fake_file',
      {},
      { instrument: null },
    );
    expect(transformMock).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        plugins: [],
      }),
    );
  });

  it('uses commonjs module transform when allowSyntheticDefaultImports=true', () => {
    const transformMock = require.requireMock('babel-core').transform;

    runHook({ allowSyntheticDefaultImports: true });
    expect(transformMock).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        plugins: ['transform-es2015-modules-commonjs'],
      }),
    );
  });

  it('doesn`t accumulate commonjs module transforms on consecutive calls', () => {
    const transformMock = require.requireMock('babel-core').transform;
    const tsCompilerOptions = { allowSyntheticDefaultImports: true };
    const tsJestConfig = {
      babelConfig: {
        plugins: [],
      },
      skipBabel: false,
    };

    runHook(tsCompilerOptions, {}, tsJestConfig);
    runHook(tsCompilerOptions, {}, tsJestConfig);

    expect(transformMock).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        plugins: ['transform-es2015-modules-commonjs'],
      }),
    );
  });
});
