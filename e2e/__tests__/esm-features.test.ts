import { runJest } from '../run-jest'

describe('esm-features', () => {
  it.each(['jest-compiler-esm.config.ts', 'jest-transpiler-esm.config.ts'])('should run %s', async (configFile) => {
    const result = await runJest('esm-features', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
