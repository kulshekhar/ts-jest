import { } from 'jest';
import { } from 'node';
import * as ts from 'typescript';
import * as fs from 'fs';

jest.mock('path');

describe('parse tsconfig with comments', () => {
  const configFile1 = './tests/tsconfig-test/allows-comments.json';
  const configFile2 = './tests/tsconfig-test/allows-comments2.json';

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-test');
  });

  it('the two config files should exist', () => {
    expect(fs.existsSync(configFile1)).toBe(true);
    expect(fs.existsSync(configFile2)).toBe(true);
  });

  it('the two config files should have comments', () => {
    // We test for comments by trying to use JSON.parse
    // which should fail.

    expect(() => {
      JSON.parse(fs.readFileSync(configFile1, 'utf8'));
    }).toThrowError();
    expect(() => {
      JSON.parse(fs.readFileSync(configFile2, 'utf8'));
    }).toThrowError();
  });

  it('should correctly read allow-comments.json', () => {
    const { getTSConfig } = require('../../src/utils');

    expect(() => {
      getTSConfig({
        '__TS_CONFIG__': 'allows-comments.json'
      });
    }).not.toThrow();
  });

});
