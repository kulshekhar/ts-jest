import { runJest } from '../run-jest'

describe('hybrid-module', () => {
  it.each(['jest-compiler-cjs.config.ts', 'jest-compiler-esm.config.ts'])('should run %s', async (configFile) => {
    const result = await runJest('hybrid-module', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
