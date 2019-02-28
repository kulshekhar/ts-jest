import * as _fs from 'fs'
import { normalize, resolve } from 'path'

import { mocked } from '../../utils'
import { logTargetMock, mockObject, mockWriteStream } from '../__helpers__/mocks'

import { processArgv } from '.'

// === helpers ================================================================
jest.mock('fs')

const fs = mocked(_fs)
let lastExitCode: number | undefined

const runCli = async (
  ...args: any[]
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

let mockedProcess: any
const FAKE_CWD = normalize('/foo/bar')
const FAKE_PKG = normalize(`${FAKE_CWD}/package.json`)
fs.existsSync.mockImplementation(f => f === FAKE_PKG)
fs.readFileSync.mockImplementation(f => {
  if (f === FAKE_PKG) return JSON.stringify({ name: 'mock', version: '0.0.0-mock.0' })
  throw new Error('ENOENT')
})

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

describe('cli', async () => {
  it('should output usage', async () => {
    expect.assertions(2)
    await expect(runCli()).resolves.toMatchInlineSnapshot(`
Object {
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
Object {
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

describe('config', async () => {
  // briefly tested, see header comment in `config/init.ts`
  describe('init', async () => {
    const noOption = ['config:init']
    const fullOptions = [
      ...noOption,
      '--tsconfig',
      'tsconfig.test.json',
      '--jsdom',
      '--no-jest-preset',
      '--js',
      'ts',
      '--babel',
    ]
    it('should create a jest.config.json (without options)', async () => {
      expect.assertions(2)
      const res = await runCli(...noOption)
      expect(res).toEqual({
        exitCode: 0,
        log: '',
        stderr: `
Jest configuration written to "${normalize('/foo/bar/jest.config.js')}".
`,
        stdout: '',
      })
      expect(fs.writeFileSync.mock.calls).toEqual([
        [
          normalize('/foo/bar/jest.config.js'),
          `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};`,
        ],
      ])
    })
    it('should create a jest.config.foo.json (with all options set)', async () => {
      expect.assertions(2)
      const res = await runCli(...fullOptions, 'jest.config.foo.js')
      expect(res).toEqual({
        exitCode: 0,
        log: '',
        stderr: `
Jest configuration written to "${normalize('/foo/bar/jest.config.foo.js')}".
`,
        stdout: '',
      })
      expect(fs.writeFileSync.mock.calls).toEqual([
        [
          normalize('/foo/bar/jest.config.foo.js'),
          `const { jsWithTs: tsjPreset } = require('ts-jest/presets');

module.exports = {
  ...tsjPreset,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      babelConfig: true,
    },
  },
};`,
        ],
      ])
    })
    it('should update package.json (without options)', async () => {
      expect.assertions(2)
      const res = await runCli(...noOption, 'package.json')
      expect(res).toEqual({
        exitCode: 0,
        log: '',
        stderr: `
Jest configuration written to "${normalize('/foo/bar/package.json')}".
`,
        stdout: '',
      })
      expect(fs.writeFileSync.mock.calls).toEqual([
        [
          normalize('/foo/bar/package.json'),
          `{
  "name": "mock",
  "version": "0.0.0-mock.0",
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
}`,
        ],
      ])
    })
    it('should update package.json (with all options set)', async () => {
      expect.assertions(2)
      const res = await runCli(...fullOptions, 'package.json')
      expect(res).toEqual({
        exitCode: 0,
        log: '',
        stderr: `
Jest configuration written to "${normalize('/foo/bar/package.json')}".
`,
        stdout: '',
      })
      expect(fs.writeFileSync.mock.calls).toEqual([
        [
          normalize('/foo/bar/package.json'),
          `{
  "name": "mock",
  "version": "0.0.0-mock.0",
  "jest": {
    "transform": {
      "^.+\\\\.[tj]sx?$": "ts-jest"
    },
    "globals": {
      "ts-jest": {
        "tsconfig": "tsconfig.test.json",
        "babelConfig": true
      }
    }
  }
}`,
        ],
      ])
    })
    it('should output help', async () => {
      const res = await runCli('help', noOption[0])
      expect(res).toMatchInlineSnapshot(`
Object {
  "exitCode": 0,
  "log": "",
  "stderr": "",
  "stdout": "
Usage:
  ts-jest config:init [options] [<config-file>]

Arguments:
  <config-file>         Can be a js or json Jest config file. If it is a
                        package.json file, the configuration will be read from
                        the \\"jest\\" property.
                        Default: jest.config.js

Options:
  --force               Discard any existing Jest config
  --js ts|babel         Process .js files with ts-jest if 'ts' or with
                        babel-jest if 'babel'
  --no-jest-preset      Disable the use of Jest presets
  --tsconfig <file>     Path to the tsconfig.json file
  --babel               Pipe babel-jest after ts-jest
  --jsdom               Use jsdom as test environment instead of node
",
}
`)
    })
  }) // init

  describe('migrate', async () => {
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
          jest: { globals: { __TS_CONFIG__: { target: 'es6' } } },
        }),
        { virtual: true },
      )
      const res = await runCli(...noOption, pkgPaths.current)
      expect(res).toMatchInlineSnapshot(`
Object {
  "exitCode": 0,
  "log": "",
  "stderr": "
Migrated Jest configuration:


Detected preset 'default' as the best matching preset for your configuration.
Visit https://kulshekhar.github.io/ts-jest/user/config/#jest-preset for more information about presets.

",
  "stdout": "\\"jest\\": {
  \\"globals\\": {
    \\"ts-jest\\": {
      \\"tsConfig\\": {
        \\"target\\": \\"es6\\"
      }
    }
  },
  \\"preset\\": \\"ts-jest\\"
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
          jest: { globals: { __TS_CONFIG__: { target: 'es6' } } },
        }),
        { virtual: true },
      )
      const res = await runCli(...fullOptions, pkgPaths.current)
      expect(res).toMatchInlineSnapshot(`
Object {
  "exitCode": 0,
  "log": "",
  "stderr": "
Migrated Jest configuration:
",
  "stdout": "\\"jest\\": {
  \\"globals\\": {
    \\"ts-jest\\": {
      \\"tsConfig\\": {
        \\"target\\": \\"es6\\"
      }
    }
  }
}
",
}
`)
      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    it('should detect same option values', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.next,
        () => ({
          jest: {
            globals: { __TS_CONFIG__: { target: 'es6' } },
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
"\\"jest\\": {
  \\"globals\\": {
    \\"ts-jest\\": {
      \\"tsConfig\\": {
        \\"target\\": \\"es6\\"
      }
    }
  },
  \\"moduleFileExtensions\\": [
    \\"js\\",
    \\"ts\\",
    \\"tsx\\"
  ],
  \\"testMatch\\": [
    \\"**/?(*.)+(spec|test).js?(x)\\",
    \\"**/?(*.)+(spec|test).ts?(x)\\",
    \\"**/__tests__/**/*.js?(x)\\",
    \\"**/__tests__/**/*.ts?(x)\\"
  ],
  \\"preset\\": \\"ts-jest\\"
}
"
`)
    })

    it('should reset testMatch if testRegex is used', async () => {
      expect.assertions(1)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.next,
        () => ({
          jest: {
            testRegex: 'foo-pattern',
          },
        }),
        { virtual: true },
      )
      const res = await runCli(...noOption, pkgPaths.current)
      expect(res.stdout).toMatchInlineSnapshot(`
"\\"jest\\": {
  \\"testRegex\\": \\"foo-pattern\\",
  \\"preset\\": \\"ts-jest\\",
  \\"testMatch\\": null
}
"
`)
    })

    it('should detect best preset', async () => {
      expect.assertions(5)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(pkgPaths.next, () => ({}), { virtual: true })

      // defaults
      jest.doMock(pkgPaths.nextCfg, () => ({}), { virtual: true })
      let res = await runCli(...noOption, pkgPaths.currentCfg)
      expect(res.stdout).toMatchInlineSnapshot(`
"module.exports = {
  preset: 'ts-jest',
}
"
`)

      // js-with-ts from args
      jest.doMock(pkgPaths.nextCfg, () => ({}), { virtual: true })
      res = await runCli(...noOption, '--allow-js', pkgPaths.currentCfg)
      expect(res.stdout).toMatchInlineSnapshot(`
"module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
}
"
`)

      // js-with-ts from previous transform
      jest.doMock(pkgPaths.nextCfg, () => ({ transform: { '^.+\\.[tj]sx?$': 'ts-jest' } }), { virtual: true })
      res = await runCli(...noOption, pkgPaths.currentCfg)
      expect(res.stdout).toMatchInlineSnapshot(`
"module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
}
"
`)

      // js-with-babel from previous transform
      jest.doMock(pkgPaths.nextCfg, () => ({ transform: { '^.+\\.jsx?$': 'babel-jest', '^.+\\.tsx?$': 'ts-jest' } }), {
        virtual: true,
      })
      res = await runCli(...noOption, pkgPaths.currentCfg)
      expect(res.stdout).toMatchInlineSnapshot(`
"module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
}
"
`)

      // defaults when previous transform is ambiguous
      jest.doMock(
        pkgPaths.nextCfg,
        () => ({ transform: { '^src/js/.+\\.jsx?$': 'babel-jest', '^src/ts/.+\\.tsx?$': 'ts-jest' } }),
        { virtual: true },
      )
      res = await runCli(...noOption, pkgPaths.currentCfg)
      expect(res.stdout).toMatchInlineSnapshot(`
"module.exports = {
  transform: {
    '^src/js/.+\\\\\\\\.jsx?$': 'babel-jest',
    '^src/ts/.+\\\\\\\\.tsx?$': 'ts-jest',
  },
  preset: 'ts-jest',
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
"\\"jest\\": {
  \\"transform\\": {
    \\"<rootDir>/src/.+\\\\\\\\.[jt]s$\\": \\"ts-jest\\",
    \\"foo\\\\\\\\.ts\\": \\"ts-jest\\",
    \\"bar\\\\\\\\.ts\\": \\"ts-jest\\"
  },
  \\"preset\\": \\"ts-jest\\"
}
"
`)
    })

    it('should output help', async () => {
      const res = await runCli('help', noOption[0])
      expect(res).toMatchInlineSnapshot(`
Object {
  "exitCode": 0,
  "log": "",
  "stderr": "",
  "stdout": "
Usage:
  ts-jest config:migrate [options] <config-file>

Arguments:
  <config-file>         Can be a js or json Jest config file. If it is a
                        package.json file, the configuration will be read from
                        the \\"jest\\" property.

Options:
  --js ts|babel         Process .js files with ts-jest if 'ts' or with
                        babel-jest if 'babel'
  --no-jest-preset      Disable the use of Jest presets
",
}
`)
    })
  }) // migrate
}) // config
