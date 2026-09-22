import { runJest } from '../run-jest'
import { getFixturePath, runCommand, runNpmCi } from '../utils'

const fixtureName = 'babel-8-compat'
const fixturePath = getFixturePath(fixtureName)
const nodeMajor = Number(process.versions.node.split('.')[0])
const supportsBabel8 = nodeMajor >= 22

const itWithBabel8Node = (...args: Parameters<typeof it>) => {
  if (supportsBabel8) {
    // eslint-disable-next-line jest/valid-title,jest/expect-expect,jest/no-disabled-tests
    return it(...args)
  }

  // eslint-disable-next-line jest/valid-title,jest/expect-expect,jest/no-disabled-tests
  return it.skip(...args)
}

beforeAll(async () => {
  if (supportsBabel8) {
    await runNpmCi(fixtureName)
  }
})

describe('Babel 8 compatibility', () => {
  itWithBabel8Node('uses Babel 8 from the fixture', async () => {
    const result = await runCommand(
      process.execPath,
      ['-p', "require('@babel/core/package.json').version"],
      fixturePath,
    )

    // eslint-disable-next-line jest/no-standalone-expect
    expect(result).toMatchObject({ exitCode: 0 })
    // eslint-disable-next-line jest/no-standalone-expect
    expect(result.stdout.trim()).toMatch(/^8\./)
  })

  for (const configFile of ['jest-compiler-cjs.config.ts', 'jest-compiler-esm.config.ts']) {
    itWithBabel8Node(`runs ${configFile} with Babel 8`, async () => {
      const result = await runJest(fixtureName, configFile)

      // eslint-disable-next-line jest/no-standalone-expect
      expect(result).toMatchObject({ exitCode: 0 })
    })
  }
})
