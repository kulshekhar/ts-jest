import { TSCONFIG_GLOBALS_KEY } from './constants';
import { TsJestConfig } from '../types';

export default function getTSJestConfig(
  jestConfig: jest.ProjectConfig | jest.InitialOptions,
): TsJestConfig {
  return (jestConfig.globals && jestConfig.globals[TSCONFIG_GLOBALS_KEY]) || {};
}
