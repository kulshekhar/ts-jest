import { } from 'jest';
import { } from 'node';
import * as ts from 'typescript'

jest.mock('path');

describe('get default ts config', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-test');
  });

  it('should correctly read tsconfig.json', () => {
    const { getTSConfig } = require('../../src/utils');
    const result = getTSConfig();

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
    const { getTSConfig } = require('../../src/utils');
    const result = getTSConfig();

    expect(result).not.toEqual({
      'target': ts.ScriptTarget.ES2015,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': true,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should not read inline tsconfig options', () => {
    const { getTSConfig } = require('../../src/utils');
    const result = getTSConfig();

    expect(result).not.toEqual({
      'module': ts.ModuleKind.CommonJS,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should be same results for null/undefined/etc.', () => {
    const { getTSConfig } = require('../../src/utils');
    const result = getTSConfig();
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
    const { getTSConfig } = require('../../src/utils');
    const config = getTSConfig({
      '__TS_CONFIG__': {
        'module': 'es2015'
      }
    });

    expect(config.module).toBe(ts.ModuleKind.ES2015);
  });

  it('should not change the module if it is loaded from a non-default config file', () => {
    const { getTSConfig } = require('../../src/utils');
    const config = getTSConfig({
      '__TS_CONFIG__': 'tsconfig-module/custom-config.json'
    });

    expect(config.module).toBe(ts.ModuleKind.ES2015);
  });

  it('should set the module to CommonJS if it is not, when loading from the default tsconfig file', () => {

    // set the base directory such that we can use 'tsconfig.json' as the 
    // config file name instead of 'dir/tsconfig.json'
    require('path').__setBaseDir('./tests/tsconfig-test/tsconfig-module');

    const { getTSConfig } = require('../../src/utils');

    const config = getTSConfig({
      '__TS_CONFIG__': 'tsconfig.json'
    });

    expect(config.module).toBe(ts.ModuleKind.CommonJS);
  });

});
