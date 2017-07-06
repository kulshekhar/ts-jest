import { MockedPath } from '../__mocks__/path';
jest.mock('path');

import * as ts from 'typescript';
import {getTSConfig} from '../../src/utils';
import * as path from 'path';


describe('get default ts config', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
      (path as any as MockedPath).__setBaseDir('./tests/tsconfig-test');
  });

  it('should correctly read tsconfig.json', () => {
    const result = getTSConfig(null);

    expect(result).toEqual({
      'inlineSourceMap': true,
      'target': ts.ScriptTarget.ES2015,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': false,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should not read my-tsconfig.json', () => {
    const result = getTSConfig(null);

    expect(result).not.toEqual({
      'target': ts.ScriptTarget.ES2015,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': true,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should not read inline tsconfig options', () => {
    const result = getTSConfig(null);

    expect(result).not.toEqual({
      'module': ts.ModuleKind.CommonJS,
      'jsx': ts.JsxEmit.React
    });
  });


  describe('old behaviour (__TS_CONFIG__)', () => {

    it('should be same results for null/undefined/etc.', () => {
      const result = getTSConfig(null);
      const resultUndefinedParam = getTSConfig(undefined);
      const resultNullParam = getTSConfig(null);
      const resultEmptyParam = getTSConfig({});
      const resultUndefinedContent = getTSConfig({ __TS_CONFIG__: undefined });
      const resultNullContent = getTSConfig({ __TS_CONFIG__: null });

      expect(result).toEqual(resultUndefinedParam);
      expect(result).toEqual(resultNullParam);
      expect(result).toEqual(resultEmptyParam);
      expect(result).toEqual(resultUndefinedContent);
      expect(result).toEqual(resultNullContent);
    });

    it('should not change the module if it is loaded from the Jest config global', () => {
      const config = getTSConfig({
        '__TS_CONFIG__': {
          'module': 'es2015'
        }
      });

      expect(config.module).toBe(ts.ModuleKind.ES2015);
    });

    it('should not change the module if it is loaded from a non-default config file', () => {
      const config = getTSConfig({
        '__TS_CONFIG__': 'tsconfig-module/custom-config.json'
      });

      expect(config.module).toBe(ts.ModuleKind.ES2015);
    });

    it('should set the module to CommonJS if it is not, when loading from the default tsconfig file', () => {

      // set the base directory such that we can use 'tsconfig.json' as the
      // config file name instead of 'dir/tsconfig.json'
      (path as any as MockedPath).__setBaseDir('./tests/tsconfig-test/tsconfig-module');

      const config = getTSConfig({
        '__TS_CONFIG__': 'tsconfig.json'
      });

      expect(config.module).toBe(ts.ModuleKind.CommonJS);
    });

  });

  describe('new behaviour (tsConfigFile & tsConfig)', () => {

    it('should be same results for null/undefined/etc.', () => {
      const result = getTSConfig(null);
      const resultUndefinedParam = getTSConfig(undefined);
      const resultNullParam = getTSConfig(null);
      const resultEmptyParam = getTSConfig({});
      const resultUndefinedContentFile = getTSConfig({ 'ts-jest': { tsConfigFile: undefined }});
      const resultNullContentFile = getTSConfig({ 'ts-jest': { tsConfigFile: null }});

      expect(result).toEqual(resultUndefinedParam);
      expect(result).toEqual(resultNullParam);
      expect(result).toEqual(resultEmptyParam);
      expect(result).toEqual(resultUndefinedContentFile);
      expect(result).toEqual(resultNullContentFile);
    });

    it('should not change the module if it is loaded from a non-default config file', () => {
      const config = getTSConfig({
        'ts-jest': {
          'tsConfigFile': 'tsconfig-module/custom-config.json'
        }
      });

      expect(config.module).toBe(ts.ModuleKind.ES2015);
    });

    it('should set the module to CommonJS if it is not, when loading from the default tsconfig file', () => {

      // set the base directory such that we can use 'tsconfig.json' as the
      // config file name instead of 'dir/tsconfig.json'
      (path as any as MockedPath).__setBaseDir('./tests/tsconfig-test/tsconfig-module');

      const config = getTSConfig({
        'ts-jest': {
          'tsConfigFile': 'tsconfig.json'
        }
      });

      expect(config.module).toBe(ts.ModuleKind.CommonJS);
    });

  });

  it('should correctly read the ts-jest object within jest settings', () => {
    (path as any as MockedPath).__setBaseDir('./tests/tsconfig-test/tsconfig-module');

    const { getTSJestConfig } = require('../../src/utils');

    const config1 = getTSJestConfig({
      'ts-jest': {
        'skipBabel': true
      },
    });

    expect(config1.skipBabel).toBe(true);

    const config2 = getTSJestConfig({
      'ts-jest': {
        'skipBabel': false
      },
    });

    expect(config2.skipBabel).toBe(false);

    expect(getTSJestConfig({ 'ts-jest': {} })).toEqual({});
    expect(getTSJestConfig({})).toEqual({});
    expect(getTSJestConfig()).toEqual({});
  });

});
