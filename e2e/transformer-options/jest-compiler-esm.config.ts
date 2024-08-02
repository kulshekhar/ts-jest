import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transformer-options-compiler-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-esm.spec.json',
        astTransformers: {
          before: [
            {
              path: '<rootDir>/../node_modules/@formatjs/ts-transformer/ts-jest-integration',
              options: {
                removeDefaultMessage: true,
              },
            },
          ],
        },
        useESM: true,
      },
    ],
  },
} satisfies JestConfigWithTsJest
