import { MockedPath } from '../__mocks__/path';
jest.mock('path');
import * as path from 'path';
import { getTSConfig } from '../../src/utils';

describe('loads extended config file relative to the original config file, not the root dir', () => {
  it('should pass', () => {
    ((path as any) as MockedPath).__setBaseDir(
      './tests/relative-extended-config',
    );

    // this should fail when `ts.parseJsonConfigFileContent()` is called without the configFile path
    const config = getTSConfig({
      'ts-jest': {
        tsConfigFile: './config/tsconfig.tests.json',
      },
    });

    // tsconfig.tests.json does not contain a "pretty" field,
    // while tsconfig.base.json does. Default value would be "false".
    expect(config.pretty).toBeTruthy();
  });
});
