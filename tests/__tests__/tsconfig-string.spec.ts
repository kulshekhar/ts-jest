jest.mock('path');

import * as path from 'path';
import * as ts from 'typescript';
import { getTSConfig } from '../../dist/utils';

describe('get ts config from string', () => {
  beforeEach(() => {
    // Set up some mocked out file info before each test
    (path as any).__setBaseDir('./tests/tsconfig-test');
  });

  describe('new behaviour (tsConfigFile & tsConfig)', () => {
    it('should correctly read my-tsconfig.json', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: 'my-tsconfig.json',
        },
      });

      expect(result).toMatchObject({
        inlineSourceMap: true,
        inlineSources: true,
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        noEmitOnError: true,
        jsx: ts.JsxEmit.React,
      });
    });

    it('should not read tsconfig.json', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: 'my-tsconfig.json',
        },
      });

      expect(result).not.toEqual({
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        noEmitOnError: false,
        jsx: ts.JsxEmit.React,
      });
    });

    it('should not read inline tsconfig options', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: 'my-tsconfig.json',
        },
      });

      expect(result).not.toEqual({
        target: ts.ScriptTarget.ES5,
        jsx: ts.JsxEmit.React,
      });
    });

    it('should correctly resolve the "extends" directive', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: 'extends-tsconfig.json',
        },
      });

      expect(result).toEqual({
        inlineSourceMap: true,
        inlineSources: true,
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        noEmitOnError: true,
        jsx: ts.JsxEmit.React,
      });
    });

    it('should correctly override any config in the "extends" directive', () => {
      const result = getTSConfig({
        'ts-jest': {
          tsConfigFile: 'extends-with-overrides-tsconfig.json',
        },
      });

      expect(result).toEqual({
        inlineSourceMap: true,
        inlineSources: true,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        noEmitOnError: true,
        jsx: ts.JsxEmit.React,
        noImplicitAny: true,
      });
    });
  });
});
