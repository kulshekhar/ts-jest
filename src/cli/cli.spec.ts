import * as _fs from 'fs'
import { normalize, resolve } from 'path'

import { logTargetMock, mockObject, mockWriteStream } from '../__helpers__/mocks'
import { JS_TRANSFORM_PATTERN, TS_JS_TRANSFORM_PATTERN, TS_TRANSFORM_PATTERN } from '../constants'

import { processArgv } from '.'

// === helpers ================================================================
jest.mock('fs')

const fs = jest.mocked(_fs)
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
      expect(res.log).toMatch(/must be a JavaScript or JSON file/)
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
            "^.+.[tj]sx?$": [
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
      {
        jest: {
          preset: 'ts-jest/foo',
        },
      },
      {
        jest: {
          preset: 'foo-preset',
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
            '^.+.[tj]sx?$': [
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
            '^.+\\\\.tsx?$': [
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
            ],
            "^.+\\\\.tsx?$": [
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
          <config-file>         Can be a js or json Jest config file. If it is a
                                package.json file, the configuration will be read from
                                the "jest" property.

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
