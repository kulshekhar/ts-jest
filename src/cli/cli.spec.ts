import { execFileSync } from 'child_process'
import * as _fs from 'fs'
import { tmpdir } from 'os'
import { join, normalize, resolve } from 'path'

import { parse as parseJson5 } from 'json5'

import { logTargetMock, mockObject, mockWriteStream } from '../__helpers__/mocks'
import {
  ESM_TS_JS_TRANSFORM_PATTERN,
  ESM_TS_TRANSFORM_PATTERN,
  JS_TRANSFORM_PATTERN,
  TS_JS_TRANSFORM_PATTERN,
  TS_TRANSFORM_PATTERN,
} from '../constants'

import { allPresets } from './helpers/presets'

import { processArgv } from '.'

// === helpers ================================================================
jest.mock('fs')

const fs = jest.mocked(_fs)
const realFs = jest.requireActual<typeof import('fs')>('fs')
const CLI_PATH = resolve(__dirname, '..', '..', 'cli.js')
let lastExitCode: number | undefined

const runCli = async (
  ...args: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<{ stdout: string; stderr: string; exitCode: number | undefined; log: string }> => {
  mockedProcess.stderr.clear()
  mockedProcess.stdout.clear()
  logTargetMock().clear()
  mockedProcess.argv.splice(2, mockedProcess.argv.length - 2, ...args)
  lastExitCode = undefined
  await processArgv()

  return {
    exitCode: lastExitCode,
    stdout: mockedProcess.stdout.written.join('\n'),
    stderr: mockedProcess.stderr.written.join('\n'),
    log: logTargetMock().lines.join('\n'),
  }
}

const parseMigratedConfig = (stdout: string) => parseJson5(stdout.replace(/^(module\.exports = |export default )/, ''))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockedProcess: any
const FAKE_CWD = normalize('/foo/bar')
const FAKE_PKG = normalize(`${FAKE_CWD}/package.json`)

// === test ===================================================================

beforeEach(() => {
  lastExitCode = undefined
  mockedProcess = mockObject(process, {
    cwd: jest.fn(() => FAKE_CWD),
    argv: ['node', resolve(__dirname, '..', '..', 'cli.js')],
    stderr: mockWriteStream(),
    stdout: mockWriteStream(),
    exit: (exitCode = 0) => {
      lastExitCode = exitCode
    },
  })
  fs.writeFileSync.mockClear()
  fs.existsSync.mockClear()
  fs.readFileSync.mockClear()
  logTargetMock().clear()
})
afterEach(() => {
  mockedProcess.mockRestore()
  mockedProcess = undefined
})

describe('cli', () => {
  it('should output usage', async () => {
    fs.existsSync.mockImplementation((f) => f === FAKE_PKG)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fs.readFileSync.mockImplementation((f): any => {
      if (f === FAKE_PKG) return JSON.stringify({ name: 'mock', version: '0.0.0-mock.0' })
      throw new Error('ENOENT')
    })
    expect.assertions(2)

    await expect(runCli()).resolves.toMatchInlineSnapshot(`
      {
        "exitCode": 0,
        "log": "",
        "stderr": "",
        "stdout": "
      Usage:
        ts-jest command [options] [...args]

      Commands:
        config:init           Creates initial Jest configuration
        config:migrate        Migrates a given Jest configuration
        help [command]        Show this help, or help about a command

      Example:
        ts-jest help config:migrate
      ",
      }
    `)
    await expect(runCli('hello:motto')).resolves.toMatchInlineSnapshot(`
      {
        "exitCode": 0,
        "log": "",
        "stderr": "",
        "stdout": "
      Usage:
        ts-jest command [options] [...args]

      Commands:
        config:init           Creates initial Jest configuration
        config:migrate        Migrates a given Jest configuration
        help [command]        Show this help, or help about a command

      Example:
        ts-jest help config:migrate
      ",
      }
    `)
  })
})

describe('config', () => {
  // briefly tested, see header comment in `config/init.ts`
  describe('init', () => {
    const noOption = ['config:init']
    const cliOptionCases = [
      {
        cliOptions: [...noOption],
        configType: 'default',
      },
      {
        cliOptions: [...noOption, '--tsconfig', 'tsconfig.test.json', '--jsdom', '--js', 'ts'],
        configType: 'js-with-ts-full-options',
      },
      {
        cliOptions: [...noOption, '--tsconfig', 'tsconfig.test.json', '--jsdom', '--js', 'babel'],
        configType: 'js-with-babel-full-options',
      },
    ]

    it.each(cliOptionCases)(
      'should create a jest config file with cli options for config type $configType',
      async ({ cliOptions }) => {
        fs.existsSync.mockImplementation((f) => f === FAKE_PKG)
        fs.readFileSync
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementationOnce((f): any => {
            if (f === FAKE_PKG) return JSON.stringify({ name: 'mock', version: '0.0.0-mock.0' })
            throw new Error('ENOENT')
          })
        expect.assertions(2)
        await runCli(...cliOptions)

        expect(fs.writeFileSync.mock.calls[0][0]).toBe(normalize('/foo/bar/jest.config.js'))
        expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot()
      },
    )

    it.each(cliOptionCases)(
      'should create a jest config file with cli options for config type $configType and type "module" package.json',
      async ({ cliOptions }) => {
        fs.existsSync.mockImplementation((f) => f === FAKE_PKG)
        fs.readFileSync
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementationOnce((f): any => {
            if (f === FAKE_PKG) return JSON.stringify({ name: 'mock', version: '0.0.0-mock.0', type: 'module' })
            throw new Error('ENOENT')
          })
        expect.assertions(2)
        await runCli(...cliOptions)

        expect(fs.writeFileSync.mock.calls[0][0]).toBe(normalize('/foo/bar/jest.config.js'))
        expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot()
      },
    )

    it.each(cliOptionCases)(
      'should update package.json for config type $configType when user defines jest config via package.json',
      async ({ cliOptions }) => {
        fs.existsSync.mockImplementation((f) => f === FAKE_PKG)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fs.readFileSync.mockImplementationOnce((f): any => {
          if (f === FAKE_PKG) return JSON.stringify({ name: 'mock', version: '0.0.0-mock.0' })
          throw new Error('ENOENT')
        })
        expect.assertions(2)
        await runCli(...cliOptions, 'package.json')

        expect(fs.writeFileSync.mock.calls[0][0]).toBe(normalize('/foo/bar/package.json'))
        expect(fs.writeFileSync.mock.calls[0][1]).toMatchSnapshot()
      },
    )

    it('should output help', async () => {
      fs.existsSync.mockImplementation((f) => f === FAKE_PKG)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fs.readFileSync.mockImplementation((f): any => {
        if (f === FAKE_PKG) return JSON.stringify({ name: 'mock', version: '0.0.0-mock.0' })
        throw new Error('ENOENT')
      })
      const res = await runCli('help', noOption[0])

      expect(res).toMatchInlineSnapshot(`
        {
          "exitCode": 0,
          "log": "",
          "stderr": "",
          "stdout": "
        Usage:
          ts-jest config:init [options] [<config-file>]

        Arguments:
          <config-file>         Can be a js or json Jest config file. If it is a
                                package.json file, the configuration will be read from
                                the "jest" property.
                                Default: jest.config.js

        Options:
          --force               Discard any existing Jest config
          --js ts|babel         Process '.js' files with ts-jest if 'ts' or with
                                babel-jest if 'babel'
          --no-jest-preset      Disable the use of Jest presets
          --tsconfig <file>     Path to the tsconfig.json file
          --babel               Enable using Babel to process 'js' resulted content from 'ts-jest' processing
          --jsdom               Use 'jsdom' as test environment instead of 'node'
        ",
        }
      `)
    })
  })

  describe('migrate', () => {
    const pkgPaths = {
      _id: 0,
      _cfgId: 0,
      get next() {
        return `./foo/${++pkgPaths._id}/package.json`
      },
      get current() {
        return `./foo/${pkgPaths._id}/package.json`
      },
      get nextCfg() {
        return `./foo/${pkgPaths._id}/jest.config.${++pkgPaths._cfgId}.js`
      },
      get currentCfg() {
        return `./foo/${pkgPaths._id}/jest.config.${pkgPaths._cfgId}.js`
      },
    }
    const noOption = ['config:migrate']
    const fullOptions = [...noOption, '--no-jest-preset', '--allow-js']
    beforeEach(() => {
      mockedProcess.cwd.mockImplementation(() => __dirname)
    })

    it('should fail if the config file does not exist', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => false)
      const res = await runCli(...noOption, pkgPaths.next)
      expect(res.log).toMatch(/does not exists/)
    })

    it('should fail if the config file is not of good type', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      const res = await runCli(...noOption, `${pkgPaths.next}.foo`)
      expect(res.log).toMatch(/must be a JavaScript, TypeScript, or JSON file/)
    })

    it('should migrate from package.json (without options)', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.next,
        () => ({
          jest: {
            globals: {
              'ts-jest': {
                tsconfig: { target: 'es6' },
              },
            },
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, pkgPaths.current)

      expect(res).toMatchInlineSnapshot(`
        {
          "exitCode": 0,
          "log": "[level:20] creating default CJS Jest preset
        ",
          "stderr": "
        Migrated Jest configuration:
        ",
          "stdout": ""jest": {
          "transform": {
            "^.+\\\\.tsx?$": [
              "ts-jest",
              {
                "tsconfig": {
                  "target": "es6"
                }
              }
            ]
          }
        }
        ",
        }
      `)
      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    it('should migrate from package.json (with options)', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.next,
        () => ({
          jest: {
            globals: {
              'ts-jest': {
                tsconfig: { target: 'es6' },
              },
            },
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...fullOptions, pkgPaths.current)

      expect(res).toMatchInlineSnapshot(`
        {
          "exitCode": 0,
          "log": "[level:20] creating Js with Ts CJS Jest preset
        ",
          "stderr": "
        Migrated Jest configuration:
        ",
          "stdout": ""jest": {
          "transform": {
            "^.+\\\\.[tj]sx?$": [
              "ts-jest",
              {
                "tsconfig": {
                  "target": "es6"
                }
              }
            ]
          }
        }
        ",
        }
      `)
      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    it('should generate transform options while keeping other jest config options', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.next,
        () => ({
          jest: {
            globals: {
              'ts-jest': {
                tsconfig: { target: 'es6' },
              },
            },
            moduleFileExtensions: ['ts', 'tsx', 'js'],
            testMatch: [
              '**/__tests__/**/*.js?(x)',
              '**/?(*.)+(spec|test).js?(x)',
              '**/__tests__/**/*.ts?(x)',
              '**/?(*.)+(spec|test).ts?(x)',
            ],
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, pkgPaths.current)

      expect(res.stdout).toMatchInlineSnapshot(`
        ""jest": {
          "moduleFileExtensions": [
            "js",
            "ts",
            "tsx"
          ],
          "testMatch": [
            "**/?(*.)+(spec|test).js?(x)",
            "**/?(*.)+(spec|test).ts?(x)",
            "**/__tests__/**/*.js?(x)",
            "**/__tests__/**/*.ts?(x)"
          ],
          "transform": {
            "^.+\\\\.tsx?$": [
              "ts-jest",
              {
                "tsconfig": {
                  "target": "es6"
                }
              }
            ]
          }
        }
        "
      `)
    })

    it.each([
      {
        jest: {
          preset: 'ts-jest',
        },
      },
    ])('should migrate preset if valid preset value is used', async (jestCfg) => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => jestCfg, { virtual: true })

      const res = await runCli(...noOption, pkgPaths.current)

      expect(res.stdout ? res.stdout : res.stderr).toMatchSnapshot()
    })

    it.each([
      { name: 'default', preset: 'ts-jest/presets/default', transformPattern: TS_TRANSFORM_PATTERN },
      {
        name: 'default legacy',
        preset: 'ts-jest/presets/default-legacy',
        transformPattern: TS_TRANSFORM_PATTERN,
        legacy: true,
      },
      {
        name: 'default ESM',
        preset: 'ts-jest/presets/default-esm',
        transformPattern: ESM_TS_TRANSFORM_PATTERN,
        esm: true,
      },
      {
        name: 'default ESM legacy',
        preset: 'ts-jest/presets/default-esm-legacy',
        transformPattern: ESM_TS_TRANSFORM_PATTERN,
        esm: true,
        legacy: true,
      },
      { name: 'js-with-ts', preset: 'ts-jest/presets/js-with-ts', transformPattern: TS_JS_TRANSFORM_PATTERN },
      {
        name: 'js-with-ts legacy',
        preset: 'ts-jest/presets/js-with-ts-legacy',
        transformPattern: TS_JS_TRANSFORM_PATTERN,
        legacy: true,
      },
      {
        name: 'js-with-ts ESM',
        preset: 'ts-jest/presets/js-with-ts-esm',
        transformPattern: ESM_TS_JS_TRANSFORM_PATTERN,
        esm: true,
      },
      {
        name: 'js-with-ts ESM legacy',
        preset: 'ts-jest/presets/js-with-ts-esm-legacy',
        transformPattern: ESM_TS_JS_TRANSFORM_PATTERN,
        esm: true,
        legacy: true,
      },
      {
        name: 'js-with-babel',
        preset: 'ts-jest/presets/js-with-babel',
        transformPattern: TS_TRANSFORM_PATTERN,
        babel: true,
      },
      {
        name: 'js-with-babel legacy',
        preset: 'ts-jest/presets/js-with-babel-legacy',
        transformPattern: TS_TRANSFORM_PATTERN,
        babel: true,
        legacy: true,
      },
      {
        name: 'js-with-babel ESM',
        preset: 'ts-jest/presets/js-with-babel-esm',
        transformPattern: ESM_TS_TRANSFORM_PATTERN,
        esm: true,
        babel: true,
      },
      {
        name: 'js-with-babel ESM legacy',
        preset: 'ts-jest/presets/js-with-babel-esm-legacy',
        transformPattern: ESM_TS_TRANSFORM_PATTERN,
        esm: true,
        babel: true,
        legacy: true,
      },
    ])('should migrate the shipped $name preset without changing its behavior', async (presetCase) => {
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      jest.doMock(configPath, () => ({ preset: presetCase.preset }), { virtual: true })

      const res = await runCli(...noOption, configPath)
      const migratedConfig = parseMigratedConfig(res.stdout)
      const expectedConfig = allPresets[presetCase.preset].value

      expect(migratedConfig).toEqual(expectedConfig)
    })

    it('should preserve an unknown preset and warn instead of substituting the default preset', async () => {
      expect.assertions(4)
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      const config = {
        preset: './custom-preset',
        globals: { unrelated: { keep: true } },
      }
      jest.doMock(configPath, () => config, { virtual: true })

      const res = await runCli(...noOption, configPath)

      expect(res.stdout).toContain("preset: './custom-preset'")
      expect(res.stdout).toContain('unrelated')
      expect(res.stderr).toContain('Unable to migrate unknown Jest preset')
      expect(config).toEqual({ preset: './custom-preset', globals: { unrelated: { keep: true } } })
    })

    it('should preserve unrelated globals while migrating ts-jest globals', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      jest.doMock(
        configPath,
        () => ({
          preset: 'ts-jest/presets/default',
          globals: {
            unrelated: { keep: true },
            'ts-jest': {
              tsconfig: { target: 'es6' },
              diagnostics: { warnOnly: true },
            },
          },
          transform: {
            [TS_TRANSFORM_PATTERN]: ['ts-jest', { tsconfig: 'explicit', isolatedModules: true }],
            '^.+\\.legacy\\.tsx?$': 'ts-jest/legacy',
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, configPath)
      const migratedConfig = parseMigratedConfig(res.stdout)

      expect(migratedConfig.globals).toEqual({ unrelated: { keep: true } })
      expect(migratedConfig.transform).toEqual({
        [TS_TRANSFORM_PATTERN]: [
          'ts-jest',
          { tsconfig: 'explicit', isolatedModules: true, diagnostics: { warnOnly: true } },
        ],
        '^.+\\.legacy\\.tsx?$': ['ts-jest/legacy', { tsconfig: { target: 'es6' }, diagnostics: { warnOnly: true } }],
      })
    })

    it('should preserve explicit user transforms over preset defaults', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      jest.doMock(
        configPath,
        () => ({
          preset: 'ts-jest/presets/js-with-babel',
          transform: {
            [JS_TRANSFORM_PATTERN]: ['custom-js-transformer', { custom: true }],
            [TS_TRANSFORM_PATTERN]: ['custom-ts-transformer', { custom: true }],
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, configPath)

      expect(parseMigratedConfig(res.stdout).transform).toEqual({
        [JS_TRANSFORM_PATTERN]: ['custom-js-transformer', { custom: true }],
        [TS_TRANSFORM_PATTERN]: ['custom-ts-transformer', { custom: true }],
      })
    })

    it('should not rewrite custom transformer names containing ts-jest', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      jest.doMock(
        configPath,
        () => ({
          preset: 'ts-jest/presets/default',
          globals: { 'ts-jest': { diagnostics: { warnOnly: true } } },
          transform: {
            '^.+\\.custom-string\\.tsx?$': 'custom-ts-jest-transformer',
            '^.+\\.custom-tuple\\.tsx?$': ['custom-ts-jest-transformer', { custom: true }],
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, configPath)

      expect(parseMigratedConfig(res.stdout).transform).toEqual({
        [TS_TRANSFORM_PATTERN]: ['ts-jest', { diagnostics: { warnOnly: true } }],
        '^.+\\.custom-string\\.tsx?$': 'custom-ts-jest-transformer',
        '^.+\\.custom-tuple\\.tsx?$': ['custom-ts-jest-transformer', { custom: true }],
      })
    })

    it('should recognize resolved root and legacy ts-jest entrypoints', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      const resolvedRootPath = require.resolve('../../dist/index.js')
      const resolvedLegacyPath = require.resolve('../../dist/legacy/index.js')
      jest.doMock(
        configPath,
        () => ({
          globals: { 'ts-jest': { diagnostics: { warnOnly: true } } },
          transform: {
            '^.+\\.resolved-root\\.tsx?$': resolvedRootPath,
            '^.+\\.resolved-legacy\\.tsx?$': [resolvedLegacyPath, { isolatedModules: true }],
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, configPath)

      expect(parseMigratedConfig(res.stdout).transform).toEqual({
        '^.+\\.resolved-root\\.tsx?$': ['ts-jest', { diagnostics: { warnOnly: true } }],
        '^.+\\.resolved-legacy\\.tsx?$': ['ts-jest/legacy', { isolatedModules: true, diagnostics: { warnOnly: true } }],
      })
    })

    it.each([
      ['root', require.resolve('../../dist/index.js'), 'ts-jest'],
      ['legacy', require.resolve('../../dist/legacy/index.js'), 'ts-jest/legacy'],
    ])(
      'should normalize a resolved %s tuple without globals and avoid adding a default transform',
      async (_, resolvedPath, expectedTransformer) => {
        expect.assertions(1)
        fs.existsSync.mockImplementation(() => true)
        const configPath = pkgPaths.nextCfg
        const transformPattern = '^.+\\.resolved-without-globals\\.tsx?$'
        jest.doMock(
          configPath,
          () => ({
            transform: {
              [transformPattern]: [resolvedPath, { isolatedModules: true }],
            },
          }),
          { virtual: true },
        )

        const res = await runCli(...noOption, configPath)

        expect(parseMigratedConfig(res.stdout).transform).toEqual({
          [transformPattern]: [expectedTransformer, { isolatedModules: true }],
        })
      },
    )

    it('should leave a custom filesystem path containing ts-jest untouched', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      const configPath = pkgPaths.nextCfg
      const customTransformerPath = resolve(__dirname, 'node_modules/ts-jest')
      jest.doMock(
        configPath,
        () => ({
          globals: { 'ts-jest': { diagnostics: { warnOnly: true } } },
          transform: {
            '^.+\\.custom-path\\.tsx?$': [customTransformerPath, { custom: true }],
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, configPath)

      expect(parseMigratedConfig(res.stdout).transform).toEqual({
        [TS_TRANSFORM_PATTERN]: ['ts-jest', { diagnostics: { warnOnly: true } }],
        '^.+\\.custom-path\\.tsx?$': [customTransformerPath, { custom: true }],
      })
    })

    it.each([
      ['root package name', 'ts-jest', 'ts-jest'],
      ['legacy package name', 'ts-jest/legacy', 'ts-jest/legacy'],
      ['root resolved entrypoint', require.resolve('../../dist/index.js'), 'ts-jest'],
      ['legacy resolved entrypoint', require.resolve('../../dist/legacy/index.js'), 'ts-jest/legacy'],
    ])(
      'should recognize a known %s string transform without adding a broad default',
      async (_, transformer, expected) => {
        expect.assertions(1)
        fs.existsSync.mockImplementation(() => true)
        const configPath = pkgPaths.nextCfg
        const transformPattern = '^src/.+\\.tsx?$'
        jest.doMock(
          configPath,
          () => ({
            transform: {
              [transformPattern]: transformer,
            },
          }),
          { virtual: true },
        )

        const res = await runCli(...noOption, configPath)

        expect(parseMigratedConfig(res.stdout).transform).toEqual({ [transformPattern]: [expected, {}] })
      },
    )

    it.each([
      ['default ESM', 'ts-jest/presets/default-esm', ESM_TS_TRANSFORM_PATTERN],
      ['default ESM legacy', 'ts-jest/presets/default-esm-legacy', ESM_TS_TRANSFORM_PATTERN],
      ['js-with-ts ESM', 'ts-jest/presets/js-with-ts-esm', ESM_TS_JS_TRANSFORM_PATTERN],
      ['js-with-ts ESM legacy', 'ts-jest/presets/js-with-ts-esm-legacy', ESM_TS_JS_TRANSFORM_PATTERN],
      ['js-with-babel ESM', 'ts-jest/presets/js-with-babel-esm', ESM_TS_TRANSFORM_PATTERN],
      ['js-with-babel ESM legacy', 'ts-jest/presets/js-with-babel-esm-legacy', ESM_TS_TRANSFORM_PATTERN],
    ])(
      'should not add a CJS transform after migrating a custom %s transform twice',
      async (_, preset, transformPattern) => {
        expect.assertions(5)
        fs.existsSync.mockImplementation(() => true)
        const firstConfigPath = `${pkgPaths.nextCfg.replace(/\.js$/, '')}.esm.js`
        jest.doMock(
          firstConfigPath,
          () => ({
            preset,
            transform: {
              [transformPattern]: ['custom-esm-transformer', { custom: true }],
            },
          }),
          { virtual: true },
        )

        const first = await runCli(...noOption, firstConfigPath)
        const firstConfig = parseMigratedConfig(first.stdout)
        const secondConfigPath = `${pkgPaths.nextCfg.replace(/\.js$/, '')}.esm.js`
        jest.doMock(secondConfigPath, () => firstConfig, { virtual: true })

        const second = await runCli(...noOption, secondConfigPath)

        expect(firstConfig.transform[transformPattern]).toEqual(['custom-esm-transformer', { custom: true }])
        expect(firstConfig.transform[TS_TRANSFORM_PATTERN]).toBeUndefined()
        expect(second.stdout).toBe('')
        expect(second.stderr).toContain('No migration needed')
        expect(fs.writeFileSync).not.toHaveBeenCalled()
      },
    )

    it('should not change a configuration when migration is run repeatedly', async () => {
      expect.assertions(3)
      fs.existsSync.mockImplementation(() => true)
      const firstConfigPath = pkgPaths.nextCfg
      jest.doMock(firstConfigPath, () => ({ preset: 'ts-jest/presets/js-with-ts' }), { virtual: true })
      const first = await runCli(...noOption, firstConfigPath)
      const firstConfig = parseMigratedConfig(first.stdout)

      const secondConfigPath = pkgPaths.nextCfg
      jest.doMock(secondConfigPath, () => firstConfig, { virtual: true })
      const second = await runCli(...noOption, secondConfigPath)

      expect(firstConfig.transform[TS_JS_TRANSFORM_PATTERN]).toBeDefined()
      expect(second.stdout).toBe('')
      expect(second.stderr).toContain('No migration needed')
    })

    it.each(['js', 'cjs', 'cts', 'ts', 'json'])('should migrate a %s configuration fixture', async (extension) => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      const configPath = resolve(__dirname, '__fixtures__', `migrate-config.${extension}`)
      if (extension === 'ts' || extension === 'cts') {
        fs.readFileSync.mockImplementation(() => "export default { preset: 'ts-jest/presets/default' }")
      }

      const res = await runCli(...noOption, configPath)

      expect(res.exitCode).toBe(0)
      expect(res.stdout).toContain(extension === 'json' ? '{' : 'module.exports')
    })

    it('should warn and leave an MTS configuration untouched', async () => {
      expect.assertions(4)
      fs.existsSync.mockImplementation(() => true)
      const configPath = resolve(__dirname, '__fixtures__', 'migrate-config.mts')

      const res = await runCli(...noOption, configPath)

      expect(res.exitCode).toBe(0)
      expect(res.stdout).toBe('')
      expect(res.stderr).toContain('Unable to migrate')
      expect(fs.readFileSync).not.toHaveBeenCalled()
    })

    it('should serialize an MJS configuration as ESM', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      const configPath = `${pkgPaths.nextCfg}.mjs`
      jest.doMock(configPath, () => ({ preset: 'ts-jest/presets/default-esm' }), { virtual: true })

      const res = await runCli(...noOption, configPath)

      expect(res.exitCode).toBe(0)
      expect(res.stdout).toMatch(/^export default /)
    })

    it('should serialize a type-module JavaScript configuration as ESM', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      const configPath = resolve(__dirname, '__fixtures__/esm-package/migrate-config.js')
      jest.doMock(configPath, () => ({ preset: 'ts-jest/presets/default' }), { virtual: true })

      const res = await runCli(...noOption, configPath)

      expect(res.exitCode).toBe(0)
      expect(res.stdout).toMatch(/^export default /)
    })

    it('should treat the nearest package scope without type as CommonJS', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      const configPath = resolve(__dirname, '__fixtures__/esm-package/nested/migrate-config.js')
      jest.doMock(configPath, () => ({ preset: 'ts-jest/presets/default' }), { virtual: true })

      const res = await runCli(...noOption, configPath)

      expect(res.exitCode).toBe(0)
      expect(res.stdout).toMatch(/^module\.exports = /)
    })

    it('should emit a standalone JSON configuration without a package.json wrapper', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      const configPath = `${pkgPaths.nextCfg}.json`
      jest.doMock(configPath, () => ({ preset: 'ts-jest/presets/default' }), { virtual: true })

      const res = await runCli(...noOption, configPath)

      expect(res.stdout).toMatch(/^\{\n/)
      expect(res.stdout).not.toContain('"jest":')
    })

    it.each([
      ['cjs', "module.exports = { preset: 'ts-jest/presets/js-with-ts' }\n"],
      ['json', '{"preset":"ts-jest/presets/js-with-ts"}\n'],
    ])('should reload serialized %s output without a second migration', async (extension, source) => {
      expect.assertions(4)
      const tempDir = realFs.mkdtempSync(join(tmpdir(), 'ts-jest-migrate-'))
      try {
        const sourcePath = join(tempDir, `source.${extension}`)
        const migratedPath = join(tempDir, `migrated.${extension}`)
        realFs.writeFileSync(sourcePath, source)
        mockedProcess.cwd.mockReturnValue(tempDir)
        fs.existsSync.mockImplementation((filePath) => realFs.existsSync(filePath))

        const first = await runCli(...noOption, sourcePath)
        realFs.writeFileSync(migratedPath, first.stdout)
        const second = await runCli(...noOption, migratedPath)

        expect(first.exitCode).toBe(0)
        expect(first.stdout).toContain('transform')
        expect(second.exitCode).toBe(0)
        expect(second.stdout).toBe('')
      } finally {
        realFs.rmSync(tempDir, { force: true, recursive: true })
      }
    })

    it('should reload serialized ESM output through the real CLI process', () => {
      const tempDir = realFs.mkdtempSync(join(tmpdir(), 'ts-jest-migrate-'))
      try {
        const sourcePath = join(tempDir, 'source.mjs')
        const migratedPath = join(tempDir, 'migrated.mjs')
        realFs.writeFileSync(sourcePath, "export default { preset: 'ts-jest/presets/default-esm' }\n")

        const first = execFileSync(process.execPath, [CLI_PATH, ...noOption, sourcePath], {
          cwd: tempDir,
          encoding: 'utf8',
        })
        realFs.writeFileSync(migratedPath, first)
        const second = execFileSync(process.execPath, [CLI_PATH, ...noOption, migratedPath], {
          cwd: tempDir,
          encoding: 'utf8',
        })

        expect(first).toMatch(/^export default /)
        expect(second).toBe('')
      } finally {
        realFs.rmSync(tempDir, { force: true, recursive: true })
      }
    })

    it.each([
      {
        jest: {
          testRegex: 'foo-pattern',
          testMatch: ['**/__tests__/**/*.(spec|test).[tj]s?(x)'],
        },
      },
      {
        jest: {
          testRegex: ['foo-pattern'],
          testMatch: ['**/__tests__/**/*.(spec|test).[tj]s?(x)'],
        },
      },
      {
        jest: {
          testRegex: [],
          testMatch: ['**/__tests__/**/*.(spec|test).[tj]s?(x)'],
        },
      },
      {
        jest: {
          testMatch: ['**/__tests__/**/*.(spec|test).[tj]s?(x)'],
        },
      },
      {
        jest: {
          testRegex: 'foo-pattern',
        },
      },
    ])('should reset testMatch if testRegex is used', async (jestCfg) => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => jestCfg, { virtual: true })

      const res = await runCli(...noOption, pkgPaths.current)

      expect(res.stdout).toMatchSnapshot()
    })

    it('should generate transform config with default CLI options', async () => {
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => ({}), { virtual: true })
      jest.doMock(pkgPaths.nextCfg, () => ({}), { virtual: true })

      const res = await runCli(...noOption, pkgPaths.currentCfg)

      expect(res.stdout).toMatchInlineSnapshot(`
        "module.exports = {
          transform: {
            '^.+\\\\.tsx?$': [
              'ts-jest',
              {},
            ],
          },
        }
        "
      `)
    })

    it('should generate transform config with allow-js in CLI options', async () => {
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => ({}), { virtual: true })
      jest.doMock(pkgPaths.nextCfg, () => ({}), { virtual: true })

      const res = await runCli(...noOption, '--allow-js', pkgPaths.currentCfg)

      expect(res.stdout).toMatchInlineSnapshot(`
        "module.exports = {
          transform: {
            '^.+\\\\.[tj]sx?$': [
              'ts-jest',
              {},
            ],
          },
        }
        "
      `)
    })

    it.each([
      {
        name: 'js-with-babel',
        transform: {
          [JS_TRANSFORM_PATTERN]: 'babel-jest',
          [TS_TRANSFORM_PATTERN]: 'ts-jest',
        },
      },
      {
        name: 'js-with-ts',
        transform: {
          [TS_JS_TRANSFORM_PATTERN]: 'ts-jest',
        },
      },
    ])('should generate transform config with existing transform options for $name', async ({ transform }) => {
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => ({}), { virtual: true })
      jest.doMock(
        pkgPaths.nextCfg,
        () => ({
          transform,
        }),
        {
          virtual: true,
        },
      )

      const res = await runCli(...noOption, pkgPaths.currentCfg)

      expect(res.stdout).toMatchSnapshot()
    })

    it('should generate transform config by merging existing transform options with default transform options', async () => {
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => ({}), { virtual: true })
      jest.doMock(
        pkgPaths.nextCfg,
        () => ({ transform: { '^src/js/.+\\.jsx?$': 'babel-jest', '^src/ts/.+\\.tsx?$': 'ts-jest' } }),
        { virtual: true },
      )

      const res = await runCli(...noOption, pkgPaths.currentCfg)

      expect(res.stdout).toMatchInlineSnapshot(`
        "module.exports = {
          transform: {
            '^src/js/.+\\\\.jsx?$': 'babel-jest',
            '^src/ts/.+\\\\.tsx?$': [
              'ts-jest',
              {},
            ],
          },
        }
        "
      `)
    })

    it('should normalize transform values', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.next,
        () => ({
          jest: {
            transform: {
              '<rootDir>/src/.+\\.[jt]s$': 'node_modules/ts-jest/preprocessor.js',
              'foo\\.ts': '<rootDir>/node_modules/ts-jest/preprocessor.js',
              'bar\\.ts': '<rootDir>/node_modules/ts-jest',
            },
          },
        }),
        { virtual: true },
      )

      const res = await runCli(...noOption, pkgPaths.current)

      expect(res.stdout).toMatchInlineSnapshot(`
        ""jest": {
          "transform": {
            "<rootDir>/src/.+\\\\.[jt]s$": [
              "ts-jest",
              {}
            ],
            "foo\\\\.ts": [
              "ts-jest",
              {}
            ],
            "bar\\\\.ts": [
              "ts-jest",
              {}
            ]
          }
        }
        "
      `)
    })

    it('should output help', async () => {
      const res = await runCli('help', noOption[0])

      expect(res).toMatchInlineSnapshot(`
        {
          "exitCode": 0,
          "log": "",
          "stderr": "",
          "stdout": "
        Usage:
          ts-jest config:migrate [options] <config-file>

        Arguments:
          <config-file>         Can be a JavaScript, TypeScript (.ts/.cts), or JSON Jest
                                config file. ESM TypeScript (.mts) requires manual
                                migration. If it is a package.json file, the
                                configuration will be read from the "jest" property.

        Options:
          --js ts|babel         Process .js files with ts-jest if 'ts' or with
                                babel-jest if 'babel'
          --no-jest-preset      Disable the use of Jest presets
        ",
        }
      `)
    })
  }) // migrate
})
