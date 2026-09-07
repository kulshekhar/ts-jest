import { runJest } from '../run-jest'
import { runNpmCi } from '../utils'

beforeAll(async () => {
  await runNpmCi('transformer-options')
})

describe('transformer-options', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('should run %s', async (configFile) => {
    const result = await runJest('transformer-options', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
