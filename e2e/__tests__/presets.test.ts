import { runJest } from '../run-jest'

describe('presets', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('should run %s', async (configFile) => {
    const result = await runJest('presets', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
