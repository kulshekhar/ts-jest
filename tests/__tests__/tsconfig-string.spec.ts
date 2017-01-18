import { } from 'jest';
import { } from 'node';
import * as ts from 'typescript';

jest.mock('path');

describe('get ts config from string', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-test');
  });

  it('should correctly read my-tsconfig.json', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'my-tsconfig.json'
    });

    expect(result).toEqual ({
      'target': ts.ScriptTarget.ES2015,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': true,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should not read tsconfig.json', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'my-tsconfig.json'
    });

    expect(result).not.toEqual ({
      'target': ts.ScriptTarget.ES2015,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': false,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should not read inline tsconfig options', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'my-tsconfig.json'
    });

    expect(result).not.toEqual ({
      'target': ts.ScriptTarget.ES5,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should correctly resolve the "extends" directive', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'extends-tsconfig.json'
    });

    expect(result).toEqual ({
      'target': ts.ScriptTarget.ES2015,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': true,
      'jsx': ts.JsxEmit.React
    });
  });

  it('should correctly override any config in the "extends" directive', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'extends-with-overrides-tsconfig.json'
    });

    expect(result).toEqual ({
      'target': ts.ScriptTarget.ES5,
      'module': ts.ModuleKind.CommonJS,
      'moduleResolution': ts.ModuleResolutionKind.NodeJs,
      'noEmitOnError': true,
      'jsx': ts.JsxEmit.React,
      'noImplicitAny': true
    });
  });

});
