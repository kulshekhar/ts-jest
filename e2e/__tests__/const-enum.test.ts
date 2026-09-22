import { runJest } from '../run-jest'

describe('const-enum', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('should run %s', async (configFile) => {
    const result = await runJest('const-enum', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
