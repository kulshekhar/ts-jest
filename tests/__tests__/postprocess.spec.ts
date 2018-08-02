jest.mock('@babel/core', () => {
  return {
    transform: jest.fn(() => {
      return { code: 'stubbed_code', map: 'stubbed_map' };
    }),
  };
});

import { getPostProcessHook } from '../../dist/postprocess';
import mockJestConfig from '../__helpers__/mock-jest-config';

describe('postprocess', () => {
  function runHook(jestConfig = {} as any) {
    return getPostProcessHook({ rootDir: '/tmp/project', ...jestConfig })(
      { code: 'input_code', map: '"input_source_map"' },
      'fake_file',
      {} as any,
      {
        instrument: null,
      },
    );
  }

  it('skips postprocess when skipBabel=true', () => {
    const transformMock = require.requireMock('@babel/core').transform;

    runHook({ globals: { 'ts-jest': { skipBabel: true } } });
    expect(transformMock).not.toBeCalled();
  });

  it('Adds no babel plugins by default', () => {
    const transformMock = require.requireMock('@babel/core').transform;

    runHook();
    getPostProcessHook(mockJestConfig('simple'))(
      { code: 'input_code', map: '"input_source_map"' },
      'fake_file',
      {} as any,
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
    const transformMock = require.requireMock('@babel/core').transform;
    const tsJestConfig = {
      babelConfig: {
        plugins: ['some-plugin'],
      },
      skipBabel: false,
    };

    runHook({ globals: { 'ts-jest': tsJestConfig } });
    runHook({ globals: { 'ts-jest': tsJestConfig } });

    expect(transformMock).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        plugins: ['some-plugin'],
      }),
    );
  });
});
