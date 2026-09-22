import { runJest } from '../run-jest'

describe('extend-ts-jest', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('should run %s', async (configFile) => {
    const result = await runJest('extend-ts-jest', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
