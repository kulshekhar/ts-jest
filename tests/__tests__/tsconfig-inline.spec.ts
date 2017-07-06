import { MockedPath } from '../__mocks__/path';
jest.mock('path');

import * as ts from 'typescript';
import {getTSConfig} from '../../src/utils';
import * as path from 'path';

describe('get inline ts config', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
      (path as any as MockedPath).__setBaseDir('./tests/tsconfig-test');
  });

  describe('old behaviour (__TS_CONFIG__)', () => {

    it('should correctly read inline tsconfig options', () => {
      const result = getTSConfig({
        '__TS_CONFIG__': {
          'module': 'commonjs',
          'jsx': 'react'
        }
      });

      expect(result).toEqual({
        'inlineSourceMap': true,
        'module': ts.ModuleKind.CommonJS,
        'jsx': ts.JsxEmit.React
      });
    });

    it('should not read tsconfig.json', () => {
      const result = getTSConfig({
        '__TS_CONFIG__': {
          'module': 'commonjs',
          'jsx': 'react'
        }
      });

      expect(result).not.toEqual({
        'target': ts.ScriptTarget.ES2015,
        'module': ts.ModuleKind.CommonJS,
        'moduleResolution': ts.ModuleResolutionKind.NodeJs,
        'noEmitOnError': false,
        'jsx': ts.JsxEmit.React
      });
    });

    it('should not read my-tsconfig.json', () => {
      const result = getTSConfig({
        '__TS_CONFIG__': {
          'module': 'commonjs',
          'jsx': 'react'
        }
      });

      expect(result).not.toEqual({
        'target': ts.ScriptTarget.ES2015,
        'module': ts.ModuleKind.CommonJS,
        'moduleResolution': ts.ModuleResolutionKind.NodeJs,
        'noEmitOnError': true,
        'jsx': ts.JsxEmit.React
      });
    });

  });


  describe('new behaviour (tsConfigFile & tsConfig)', () => {

    it('should correctly read inline tsconfig options', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: {
            'module': 'commonjs',
            'jsx': 'react'
          }
        }
      });

      expect(result).toEqual({
        'inlineSourceMap': true,
        'module': ts.ModuleKind.CommonJS,
        'jsx': ts.JsxEmit.React
      });
    });

    it('should not read tsconfig.json', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: {
            'module': 'commonjs',
            'jsx': 'react'
          }
        }
      });

      expect(result).not.toEqual({
        'target': ts.ScriptTarget.ES2015,
        'module': ts.ModuleKind.CommonJS,
        'moduleResolution': ts.ModuleResolutionKind.NodeJs,
        'noEmitOnError': false,
        'jsx': ts.JsxEmit.React
      });
    });

    it('should not read my-tsconfig.json', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: {
            'module': 'commonjs',
            'jsx': 'react'
          }
        }
      });

      expect(result).not.toEqual({
        'target': ts.ScriptTarget.ES2015,
        'module': ts.ModuleKind.CommonJS,
        'moduleResolution': ts.ModuleResolutionKind.NodeJs,
        'noEmitOnError': true,
        'jsx': ts.JsxEmit.React
      });
    });

  });

});
