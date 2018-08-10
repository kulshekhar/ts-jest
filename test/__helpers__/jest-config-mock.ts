import { TsJestGlobalOptions } from '../../src/types';
import tsJestConfigMock from './ts-jest-config-mock';

export default function jestConfigMock<T extends jest.ProjectConfig>(
  options?: jest.InitialOptions,
  tsJestOptions?: TsJestGlobalOptions,
): T {
  const res = {
    globals: {},
    moduleFileExtensions: ['ts', 'js'],
    ...options,
  } as any;
  if (tsJestOptions) {
    res.globals['ts-jest'] = tsJestConfigMock(tsJestOptions);
  }
  return res;
}
