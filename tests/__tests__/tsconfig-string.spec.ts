jest.mock('path');

import getTSConfig from '../../dist/utils/get-ts-config';
import * as ts from 'typescript';
import * as path from 'path';
import cfg from '../__helpers__/jest-config';

describe('get ts config from string', () => {
  beforeEach(() => {
    // Set up some mocked out file info before each test
    (path as any).__setBaseDir('./tests/tsconfig-test');
  });

  describe('new behaviour (tsConfigFile & tsConfig)', () => {
    it('should correctly read my-tsconfig.json', () => {
      const result = getTSConfig(
        cfg.tsconfigTest({ tsConfigFile: 'my-tsconfig.json' }),
      );

      // snapshot would be enough here, but that adds a security in case we do not see it in a PR
      expect(result.target).toBe(ts.ScriptTarget.ES2015); // es6 resolves to ES2015 enum value
      expect(result).toMatchSnapshot();
    });

    it('should correctly resolve the "extends" directive', () => {
      const result = getTSConfig(
        cfg.tsconfigTest({ tsConfigFile: 'extends-tsconfig.json' }),
      );

      // snapshot would be enough here, but that adds a security in case we do not see it in a PR
      expect(result.target).toBe(ts.ScriptTarget.ES2015); // es6 resolves to ES2015 enum value
      expect(result).toMatchSnapshot();
    });

    it('should correctly override any config in the "extends" directive', () => {
      const result = getTSConfig(
        cfg.tsconfigTest({
          tsConfigFile: 'extends-with-overrides-tsconfig.json',
        }),
      );

      // snapshot would be enough here, but that adds a security in case we do not see it in a PR
      expect(result.target).toBe(ts.ScriptTarget.ES5);
      expect(result).toMatchSnapshot();
    });
  });
});
