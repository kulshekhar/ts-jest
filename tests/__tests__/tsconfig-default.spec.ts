import { MockedPath } from '../__mocks__/path';
jest.mock('path');

import * as ts from 'typescript';
import getTSConfig from '../../dist/utils/get-ts-config';
import * as path from 'path';
import mockJestConfig from '../__helpers__/mock-jest-config';
import getTSJestConfig from '../../dist/utils/get-ts-jest-config';

const TEST_CASE = 'tsconfig-test';

describe('get default ts config', () => {
  beforeEach(() => {
    // Set up some mocked out file info before each test
    ((path as any) as MockedPath).__setBaseDir('./tests/tsconfig-test');
    // empties the lodash memoized cache for this function
    getTSConfig.cache.clear();
  });

  it('should correctly read tsconfig.json', () => {
    const result = getTSConfig(mockJestConfig(TEST_CASE));

    expect(result).toMatchSnapshot();
  });

  describe('new behavior (tsConfigFile & tsConfig)', () => {
    it('should be same results for null/undefined/etc.', () => {
      const resultWithoutTsJestSection = getTSConfig(
        mockJestConfig(TEST_CASE, null),
      );
      const resultEmptyParam = getTSConfig(mockJestConfig(TEST_CASE, {}));
      const resultUndefinedContentFile = getTSConfig(
        mockJestConfig(TEST_CASE, { tsConfigFile: undefined }),
      );
      const resultNullContentFile = getTSConfig(
        mockJestConfig(TEST_CASE, { tsConfigFile: null }),
      );

      expect(resultEmptyParam).toEqual(resultWithoutTsJestSection);
      expect(resultUndefinedContentFile).toEqual(resultWithoutTsJestSection);
      expect(resultNullContentFile).toEqual(resultWithoutTsJestSection);
    });

    it('should be different results for different rootDir with same jest config.', () => {
      const rootConfig = getTSConfig(mockJestConfig(TEST_CASE));
      const subConfig = getTSConfig(
        mockJestConfig(`${TEST_CASE}/tsconfig-module`),
      );
      expect(rootConfig).not.toEqual(subConfig);
    });

    it('should not change the module if it is loaded from a non-default config file', () => {
      const config = getTSConfig(
        mockJestConfig(TEST_CASE, {
          tsConfigFile: 'tsconfig-module/custom-config.json',
        }),
      );

      // snapshot would be enough here, but that adds a security in case we do not see it in a PR
      expect(config.module).toBe(ts.ModuleKind.ES2015);
      expect(config.module).toMatchSnapshot();
    });

    it('should set the module to CommonJS if it is not, when loading from the default tsconfig file', () => {
      // set the base directory such that we can use 'tsconfig.json' as the
      // config file name instead of 'dir/tsconfig.json'
      ((path as any) as MockedPath).__setBaseDir(
        './tests/tsconfig-test/tsconfig-module',
      );

      const config = getTSConfig(
        mockJestConfig(`${TEST_CASE}/tsconfig-module`),
      );

      expect(config.module).toBe(ts.ModuleKind.CommonJS);
    });
  });

  it('should correctly read the ts-jest object within jest settings', () => {
    ((path as any) as MockedPath).__setBaseDir(
      './tests/tsconfig-test/tsconfig-module',
    );

    const config1 = getTSJestConfig({
      globals: {
        'ts-jest': {
          skipBabel: true,
        },
      },
    });

    expect(config1.skipBabel).toBe(true);

    const config2 = getTSJestConfig({
      globals: {
        'ts-jest': {
          skipBabel: false,
        },
      },
    });

    expect(config2.skipBabel).toBe(false);

    expect(getTSJestConfig({ globals: { 'ts-jest': {} } })).toEqual({});
    expect(getTSJestConfig({})).toEqual({});
  });
});
