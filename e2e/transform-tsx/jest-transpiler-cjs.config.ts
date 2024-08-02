import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transform-tsx-transpiler-cjs',
  testEnvironment: 'jsdom',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-cjs.spec.json',
        isolatedModules: true,
      },
    ],
  },
} satisfies JestConfigWithTsJest
