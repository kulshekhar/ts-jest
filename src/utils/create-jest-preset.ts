import * as jestConfig from 'jest-config';
import { CreateJestPresetOptions } from '../types';

// jest 22 doesn't have defaults
const defaults = jestConfig.defaults || {
  transform: null,
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
};

// TODO: find out if tsconfig that we'll use contains `allowJs`
// and change the transform so that it also uses ts-jest for js files

export default function createJestPreset({
  allowJs = false,
}: CreateJestPresetOptions = {}) {
  return {
    transform: {
      ...defaults.transform,
      [allowJs ? '^.+\\.[tj]sx?$' : '^.+\\.tsx?$']: 'ts-jest',
    },
    testMatch: [
      ...defaults.testMatch,
      '**/__tests__/**/*.ts?(x)',
      '**/?(*.)+(spec|test).ts?(x)',
    ],
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  };
}
