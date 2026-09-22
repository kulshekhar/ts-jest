import { runJest } from '../run-jest'
import { runNpmCi } from '../utils'

describe('hoist-jest', () => {
  beforeAll(async () => runNpmCi('hoist-jest'))

  it.each(['jest-compiler-cjs.config.ts', 'jest-transpiler-cjs.config.ts'])('should run %s', async (configFile) => {
    const result = await runJest('hoist-jest', configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })
})
