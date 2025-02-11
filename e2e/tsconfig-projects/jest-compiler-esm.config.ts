import { type JestConfigWithTsJest, TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'tsconfig-projects-compiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
} satisfies JestConfigWithTsJest
