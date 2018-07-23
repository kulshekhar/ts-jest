import { MockedPath } from '../__mocks__/path';
jest.mock('path');
import * as fs from 'fs';
import getTSConfig from '../../dist/utils/get-ts-config';
import * as path from 'path';
import cfg from '../__helpers__/jest-config';

describe('parse tsconfig with comments', () => {
  const configFile1 = './tests/tsconfig-test/allows-comments.json';
  const configFile2 = './tests/tsconfig-test/allows-comments2.json';

  beforeEach(() => {
    // Set up some mocked out file info before each test
    ((path as any) as MockedPath).__setBaseDir('./tests/tsconfig-test');
    getTSConfig.cache.clear();
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
    }).toThrow();

    expect(() => {
      JSON.parse(fs.readFileSync(configFile2, 'utf8'));
    }).toThrow();
  });

  describe('new behaviour (tsConfigFile & tsConfig)', () => {
    // allows-comments.json does not contain a "pretty" field,
    // while allows-comments2.json does.
    // allow-comments.json extends allow-comments2.json
    it('should correctly read allow-comments.json', () => {
      const config = getTSConfig(
        cfg.tsconfigTest({ tsConfigFile: 'allows-comments.json' }),
      );
      expect(config).toMatchSnapshot();
    });
    it('should correctly read allow-comments2.json', () => {
      const config = getTSConfig(
        cfg.tsconfigTest({ tsConfigFile: 'allows-comments2.json' }),
      );
      expect(config).toMatchSnapshot();
    });
  });
});
