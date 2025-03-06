import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transformer-in-ts-transpiler-cjs',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-cjs-transpiler.spec.json',
        astTransformers: {
          before: [
            {
              path: '<rootDir>/../../src/transformers/hoist-jest.ts',
            },
          ],
        },
      },
    ],
  },
} satisfies JestConfigWithTsJest
