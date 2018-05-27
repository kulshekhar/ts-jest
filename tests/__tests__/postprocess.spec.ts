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

  it('Adds no babel plugins by default', () => {
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

  it('doesn`t accumulate module transforms on consecutive calls', () => {
    const transformMock = require.requireMock('babel-core').transform;
    const tsJestConfig = {
      babelConfig: {
        plugins: ['some-plugin'],
      },
      skipBabel: false,
    };

    runHook({}, {}, tsJestConfig);
    runHook({}, {}, tsJestConfig);

    expect(transformMock).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        plugins: ['some-plugin'],
      }),
    );
  });
});
