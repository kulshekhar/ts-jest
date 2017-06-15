import { MockedPath } from '../__mocks__/path';
jest.mock('path');
import * as fs from 'fs';
import * as tsconfig from 'tsconfig';
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
    const content = fs.readFileSync(configFile1, 'utf8');
    const config = tsconfig.parse(content, configFile1);

    expect(config.extends).toEqual('allows-comments2.json');
  });

  it('should correctly read allow-comments.json', () => {
    expect(() => {
      getTSConfig({
        '__TS_CONFIG__': 'allows-comments.json'
      });
    }).not.toThrow();
  });

});
