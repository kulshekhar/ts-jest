import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transformer-in-ts-compiler-cjs',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig-cjs.spec.json',
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
