jest.mock('babel-core', () => {
  return {
    transform: jest.fn(() => {
      return { code: 'stubbed_code' };
    }),
  };
});

import { getPostProcessHook } from '../../src/postprocess';

describe('postprocess', () => {
  function runHook(tsCompilerOptions = {}, jestConfig = {}, tsJestConfig = {}) {
    return getPostProcessHook(tsCompilerOptions, jestConfig, tsJestConfig)(
      'input_code',
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

  it('Adds no babel plugins by default', () => {
    const transformMock = require.requireMock('babel-core').transform;

    runHook();
    getPostProcessHook({}, {}, {})(
      'input_code',
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

  it('doesn`t accumulate module transforms on consecutive calls', () => {
    const transformMock = require.requireMock('babel-core').transform;
    const tsCompilerOptions = { allowSyntheticDefaultImports: true };
    const tsJestConfig = {
      babelConfig: {
        plugins: ['some-plugin'],
      },
      skipBabel: false,
    };

    runHook(tsCompilerOptions, {}, tsJestConfig);
    runHook(tsCompilerOptions, {}, tsJestConfig);

    expect(transformMock).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        plugins: ['some-plugin'],
      }),
    );
  });
});
