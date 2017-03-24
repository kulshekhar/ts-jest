import { } from 'jest';
import { } from 'node';
import * as ts from 'typescript';

jest.mock('path');

describe('parse tsconfig with comments', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-test');
  });

  it('should correctly read allow-comments.json', () => {
    const { getTSConfig } = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'allow-comments.json'
    });

    expect(result).toEqual({
      'target': ts.ScriptTarget.ES2015
    });
  });

});
