import config from './jest.config.js'

/** @type {import('../../dist').JestConfigWithTsJest} */
export default {
  ...config,
  transform: {
    '^.+\\.m?tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
}
