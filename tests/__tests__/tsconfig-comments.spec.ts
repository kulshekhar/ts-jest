import { MockedPath } from '../__mocks__/path';
jest.mock('path');
import * as fs from 'fs';
import {getTSConfig} from '../../src/utils';
import * as path from 'path';


describe('parse tsconfig with comments', () => {
  const configFile1 = './tests/tsconfig-test/allows-comments.json';
  const configFile2 = './tests/tsconfig-test/allows-comments2.json';

  beforeEach(() => {
    // Set up some mocked out file info before each test
    (path as any as MockedPath).__setBaseDir('./tests/tsconfig-test');
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

  it('one config file should extend the other', () => {
    const config = getTSConfig({
      __TS_CONFIG__: 'allows-comments.json'
    });

    // allows-comments.json does not contain a "pretty" field,
    // while allows-comments2.json does. Default value would be "false".
    expect(config.pretty).toEqual(true);
  });

  it('should correctly read allow-comments.json', () => {
    expect(() => {
      getTSConfig({
        '__TS_CONFIG__': 'allows-comments.json'
      });
    }).not.toThrow();
  });

});
