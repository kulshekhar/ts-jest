import { pathsToModuleNameMapper } from '../../dist/index.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const tsConfig = require('./tsconfig.json')

/** @type {import('../../dist').JestConfigWithTsJest} */
export default {
  extensionsToTreatAsEsm: ['.ts'],
  resolver: '<rootDir>/mjs-resolver.ts',
  moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix: '<rootDir>',
    useESM: true,
  }),
  transform: {
    '^.+\\.m?tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        useESM: true,
      },
    ],
  },
}
