import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transformer-in-ts-transpiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig-esm.spec.json',
        astTransformers: {
          before: [
            {
              path: '<rootDir>/../../src/transformers/hoist-jest.ts',
            },
          ],
        },
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
} satisfies JestConfigWithTsJest
