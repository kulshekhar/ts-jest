import { TsJestConfig } from '../../src/types';

const { resolve } = require.requireActual('path');

/**
 * Mock a jest config object for the test case in given folder
 *
 * Basically it defines `rootDir` and `cwd` properties to the full path of that
 * test case, as Jest would do.
 *
 * Accepts an optional config object, which will be defined on `globals.ts-jest`
 */
export default function mockJestConfig(
  testCaseFolder: string,
  tsJest: TsJestConfig | null = null,
): jest.ProjectConfig {
  // resolves the path since jest would give a resolved path
  const rootDir = resolve(__dirname, '..', testCaseFolder);
  // create base jest config object
  const options: any = { rootDir, cwd: rootDir };
  // adds TS Jest options if any given
  if (tsJest != null) {
    options.globals = { 'ts-jest': tsJest };
  }
  return options;
}
