import { type JestConfigWithTsJest, TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'extend-ts-jest-transpiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-esm.spec.json',
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
} satisfies JestConfigWithTsJest
