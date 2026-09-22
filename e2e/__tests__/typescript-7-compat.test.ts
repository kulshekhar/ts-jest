import { Importer } from '../../src/utils/importer'
import { runJest } from '../run-jest'
import { getFixturePath, runCommand, runNpmCi } from '../utils'

const fixtureName = 'typescript-7-compat'
const fixturePath = getFixturePath(fixtureName)

beforeAll(() => runNpmCi(fixtureName))

describe('TypeScript 7 compatibility', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('runs %s with TypeScript 6 JavaScript API', async (configFile) => {
    const result = await runJest(fixtureName, configFile)

    expect(result).toMatchObject({ exitCode: 0 })
  })

  it('exposes native tsc and JavaScript tsc6', async () => {
    const nativeResult = await runCommand(`${fixturePath}/node_modules/.bin/tsc`, ['--version'], fixturePath)
    const javaScriptResult = await runCommand(`${fixturePath}/node_modules/.bin/tsc6`, ['--version'], fixturePath)

    expect(nativeResult).toMatchObject({ exitCode: 0 })
    expect(nativeResult.stdout.trim()).toBe('Version 7.0.2')
    expect(javaScriptResult).toMatchObject({ exitCode: 0 })
    expect(javaScriptResult.stdout.trim()).toMatch(/^Version 6\./)
  })

  describe('with the fixture as the working directory', () => {
    let workingDirectory: string

    beforeEach(() => {
      workingDirectory = process.cwd()
      process.chdir(fixturePath)
    })

    afterEach(() => {
      process.chdir(workingDirectory)
    })

    it('rejects native TypeScript compiler API', () => {
      // @ts-expect-error testing purpose to bypass ImportReason type check
      expect(() => new Importer().typescript('Testing direct TypeScript 7 usage.', '@typescript/native')).toThrow(
        /does not expose the JavaScript compiler API required by ts-jest/,
      )
    })
  })
})
