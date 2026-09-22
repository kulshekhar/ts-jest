import { runJest } from '../run-jest'
import { getFixturePath, runCommand, runNpmCi } from '../utils'

const fixtureName = 'typescript-pre-7-compat'
const fixturePath = getFixturePath(fixtureName)

beforeAll(() => runNpmCi(fixtureName))

describe('TypeScript Pre-7 compatibility', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('runs %s', async (configFile) => {
    const result = await runJest(fixtureName, configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })

  it('exposes tsc', async () => {
    const result = await runCommand(`${fixturePath}/node_modules/.bin/tsc`, ['--version'], fixturePath)

    expect(result).toMatchObject({ exitCode: 0 })
    expect(result.stdout.trim()).toBe('Version 5.9.3')
  })
})
