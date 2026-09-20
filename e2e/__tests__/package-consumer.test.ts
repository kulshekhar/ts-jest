import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { getFixturePath, PROJECT_ROOT_DIR, runCommand } from '../utils'

const fixtureName = 'package-consumer'
const fixturePath = getFixturePath(fixtureName)
const nodeModulesPath = path.join(fixturePath, 'node_modules')
const packageConsumers = [
  { name: 'TypeScript 5.4', specifier: 'typescript@5.4.5', version: '5.4.5' },
  { name: 'TypeScript 5.9', specifier: 'typescript@5.9.3', version: '5.9.3' },
  { name: 'TypeScript 6', specifier: '@typescript/typescript6@6.0.2', version: '6.0.2' },
] as const
const requestedTypeScriptVersion = process.env.TS_JEST_PACKAGE_CONSUMER_TYPESCRIPT_VERSION
const packageConsumersToRun = requestedTypeScriptVersion
  ? packageConsumers.filter(({ version }) => version === requestedTypeScriptVersion)
  : packageConsumers

if (requestedTypeScriptVersion && packageConsumersToRun.length === 0) {
  throw new Error(`Unsupported package consumer TypeScript version: ${requestedTypeScriptVersion}`)
}

let packedPackageFiles: string[] = []

const runFixtureJest = (configFile: string, useEsm: boolean) => {
  const jestPath = path.join(nodeModulesPath, 'jest', 'bin', 'jest.js')
  const nodeOptions = useEsm ? ['--experimental-vm-modules', '--no-warnings'] : []

  return runCommand(
    process.execPath,
    [...nodeOptions, jestPath, '--config', path.join(fixturePath, configFile), '--runInBand', '--no-cache'],
    fixturePath,
  )
}

const installTypeScript = async (specifier: string): Promise<void> => {
  const packageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-jest-package-consumer-'))

  try {
    const packResult = await runCommand(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', packageDirectory, specifier],
      PROJECT_ROOT_DIR,
    )

    if (packResult.exitCode !== 0) {
      throw new Error(`npm pack failed for ${specifier}\n${packResult.stdout}\n${packResult.stderr}`)
    }

    const [{ filename }] = JSON.parse(packResult.stdout) as Array<{ filename: string }>
    const packagePath = path.join(packageDirectory, filename)
    const extractResult = await runCommand('tar', ['-xzf', packagePath, '-C', packageDirectory], PROJECT_ROOT_DIR)

    if (extractResult.exitCode !== 0) {
      throw new Error(`TypeScript package extraction failed for ${specifier}\n${extractResult.stderr}`)
    }

    fs.rmSync(path.join(nodeModulesPath, 'typescript'), { force: true, recursive: true })
    fs.cpSync(path.join(packageDirectory, 'package'), path.join(nodeModulesPath, 'typescript'), { recursive: true })
  } finally {
    fs.rmSync(packageDirectory, { force: true, recursive: true })
  }
}

beforeAll(async () => {
  fs.rmSync(nodeModulesPath, { force: true, recursive: true })

  const dependencyInstallResult = await runCommand('npm', ['ci', '--ignore-scripts', '--prefer-offline'], fixturePath)

  if (dependencyInstallResult.exitCode !== 0) {
    throw new Error(
      `package consumer dependency install failed\n${dependencyInstallResult.stdout}\n${dependencyInstallResult.stderr}`,
    )
  }

  const packResult = await runCommand('npm', ['pack', '--json', '--pack-destination', fixturePath], PROJECT_ROOT_DIR)

  if (packResult.exitCode !== 0) {
    throw new Error(`npm pack failed\n${packResult.stdout}\n${packResult.stderr}`)
  }

  const [{ filename, files }] = JSON.parse(packResult.stdout) as Array<{
    filename: string
    files: Array<{ path: string }>
  }>
  packedPackageFiles = files.map(({ path: filePath }) => filePath)
  const packagePath = path.join(fixturePath, filename)
  const installResult = await runCommand(
    'npm',
    ['install', '--ignore-scripts', '--no-package-lock', '--no-save', '--prefer-offline', packagePath],
    fixturePath,
  )

  if (installResult.exitCode !== 0) {
    throw new Error(`package consumer install failed\n${installResult.stdout}\n${installResult.stderr}`)
  }
})

afterAll(() => {
  fs.rmSync(nodeModulesPath, { force: true, recursive: true })
  for (const file of fs.readdirSync(fixturePath)) {
    if (file.endsWith('.tgz')) {
      fs.rmSync(path.join(fixturePath, file))
    }
  }
})

describe('packed package consumers', () => {
  it('should exclude repository plans from the packed package', () => {
    expect(packedPackageFiles.some((filePath) => filePath.startsWith('docs/plans/'))).toBe(false)
  })

  it('should exclude generated analysis artifacts from the packed package', () => {
    expect(packedPackageFiles.some((filePath) => filePath.startsWith('graphify-out/'))).toBe(false)
  })

  it('should retain historical package entries', () => {
    expect(packedPackageFiles).toEqual(
      expect.arrayContaining(['.lintstagedrc', 'CONTRIBUTING.md', 'preprocessor.js', 'presets/default/jest-preset.js']),
    )
  })

  describe.each(packageConsumersToRun)('$name', ({ specifier, version }) => {
    beforeAll(() => installTypeScript(specifier))

    it('should run a CommonJS consumer', async () => {
      const result = await runFixtureJest('jest-cjs.config.cjs', false)

      expect(result).toMatchObject({ exitCode: 0 })
    })

    it('should run an ESM consumer', async () => {
      const result = await runFixtureJest('jest-esm.config.mjs', true)

      expect(result).toMatchObject({ exitCode: 0 })
    })

    test.each([
      {
        name: 'CommonJS',
        tsconfigFile: 'tsconfig-custom-conditions.json',
        preserveForTypeScript6: true,
        useESM: false,
      },
      {
        name: 'Preserve',
        tsconfigFile: 'tsconfig-custom-conditions-preserve.json',
        preserveForTypeScript6: false,
        useESM: true,
      },
    ])(
      'should apply runtime-specific customConditions handling for $name when moduleResolution is omitted',
      async ({ tsconfigFile, preserveForTypeScript6, useESM }) => {
        const result = await runCommand(
          process.execPath,
          [
            '-e',
            `const path = require('node:path')
const { ConfigSet } = require('ts-jest/dist/legacy/config/config-set')
const { TsCompiler } = require('ts-jest/dist/legacy/compiler/ts-compiler')
const configSet = new ConfigSet({
  cwd: process.cwd(),
  rootDir: process.cwd(),
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: ${useESM},
      tsconfig: path.join(process.cwd(), '${tsconfigFile}'),
    },
  },
  testMatch: [],
  testRegex: [],
})
const compiler = new TsCompiler(configSet, new Map())
compiler.getCompiledOutput('const value = 1', path.join(process.cwd(), 'value.ts'), {
  depGraphs: new Map(),
  supportsStaticESM: ${useESM},
  watchMode: false,
})
console.log(JSON.stringify({
  version: configSet.compilerModule.version,
  customConditions: compiler._compilerOptions.customConditions,
}))`,
          ],
          fixturePath,
        )

        expect(result).toMatchObject({ exitCode: 0 })
        expect(JSON.parse(result.stdout.trim())).toEqual({
          version,
          customConditions: preserveForTypeScript6 && !version.startsWith('6.') ? undefined : ['runtime-condition'],
        })
      },
    )
  })
})
