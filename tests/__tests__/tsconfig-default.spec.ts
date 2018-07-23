import { MockedPath } from '../__mocks__/path';
jest.mock('path');

import * as ts from 'typescript';
import getTSConfig from '../../dist/utils/get-ts-config';
import * as path from 'path';
import jestConfig from '../__helpers__/jest-config';
import getTSJestConfig from '../../dist/utils/get-ts-jest-config';

describe('get default ts config', () => {
  beforeEach(() => {
    // Set up some mocked out file info before each test
    ((path as any) as MockedPath).__setBaseDir('./tests/tsconfig-test');
    // empties the lodash memoized cache for this function
    getTSConfig.cache.clear();
  });

  it('should bail when no default tsconfig.json found', () => {
    // there is no tsconfig file in that test module
    ((path as any) as MockedPath).__setBaseDir('./tests/jestconfig-test');

    expect(() => getTSConfig(jestConfig.jestconfigTest(null))).toThrowError(
      /unable to find ts configuration file/i,
    );
  });

  it('should correctly read tsconfig.json', () => {
    const result = getTSConfig(jestConfig.tsconfigTest(null));

    expect(result).toMatchSnapshot();
  });

  describe('new behavior (tsConfigFile & tsConfig)', () => {
    it('should be same results for null/undefined/etc.', () => {
      const result = getTSConfig(jestConfig.tsconfigTest(null));
      const resultEmptyParam = getTSConfig(jestConfig.tsconfigTest({}));
      const resultUndefinedContentFile = getTSConfig(
        jestConfig.tsconfigTest({ tsConfigFile: undefined }),
      );
      const resultNullContentFile = getTSConfig(
        jestConfig.tsconfigTest({ tsConfigFile: null }),
      );

      expect(result).toEqual(resultEmptyParam);
      expect(result).toEqual(resultUndefinedContentFile);
      expect(result).toEqual(resultNullContentFile);
    });

    it('should be different results for different rootDir with same jest config.', () => {
      const rootConfig = getTSConfig(jestConfig.tsconfigTest());
      const subConfig = getTSConfig(
        jestConfig('tsconfig-test/tsconfig-module'),
      );
      expect(rootConfig).not.toEqual(subConfig);
    });

    it('should not change the module if it is loaded from a non-default config file', () => {
      const config = getTSConfig(
        jestConfig.tsconfigTest({
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

      const config = getTSConfig(jestConfig('tsconfig-test/tsconfig-module'));

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
