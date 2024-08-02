import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transformer-options-transpiler-cjs',
  testEnvironment: 'jsdom',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-cjs.spec.json',
        astTransformers: {
          before: [
            {
              path: '@formatjs/ts-transformer/ts-jest-integration',
              options: {
                removeDefaultMessage: true,
              },
            },
          ],
        },
        isolatedModules: true,
      },
    ],
  },
} satisfies JestConfigWithTsJest
