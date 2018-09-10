import { testing } from 'bs-logger'
import * as _fs from 'fs'
import { normalize, resolve } from 'path'

import { mocked } from '../__helpers__/mocks'
import { rootLogger as _rootLogger } from '../util/logger'

import { processArgv } from '.'

// === helpers ================================================================
jest.mock('../util/logger')
jest.mock('fs')
const fs = mocked(_fs)
const rootLogger = _rootLogger as testing.LoggerMock

const mockWriteStream = () => {
  return {
    written: [] as string[],
    write(text: string) {
      this.written.push(text)
    },
    clear() {
      this.written = []
    },
  }
}

const mockObject = <T, M>(obj: T, newProps: M): T & M & { mockRestore: () => T } => {
  const backup: any = Object.create(null)

  Object.keys(newProps).forEach(key => {
    const desc = (backup[key] = Object.getOwnPropertyDescriptor(obj, key))
    const newDesc: any = { ...desc }
    if (newDesc.get) {
      newDesc.get = () => (newProps as any)[key]
    } else {
      newDesc.value = (newProps as any)[key]
    }
    Object.defineProperty(obj, key, newDesc)
  })
  if ((obj as any).mockRestore) backup.mockRestore = Object.getOwnPropertyDescriptor(obj, 'mockRestore')
  return Object.defineProperty(obj, 'mockRestore', {
    value() {
      Object.keys(backup).forEach(key => {
        Object.defineProperty(obj, key, backup[key])
      })
      return obj
    },
    configurable: true,
  })
}

let lastExitCode: number | undefined

const runCli = async (
  ...args: any[]
): Promise<{ stdout: string; stderr: string; exitCode: number | undefined; log: string }> => {
  mockedProcess.stderr.clear()
  mockedProcess.stdout.clear()
  rootLogger.target.clear()
  mockedProcess.argv.splice(2, mockedProcess.argv.length - 2, ...args)
  lastExitCode = undefined
  await processArgv()
  return {
    exitCode: lastExitCode,
    stdout: mockedProcess.stdout.written.join('\n'),
    stderr: mockedProcess.stderr.written.join('\n'),
    log: rootLogger.target.lines.join('\n'),
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
  // jest.resetModules()
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
  rootLogger.target.clear()
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
      '--babel',
      '--tsconfig',
      'tsconfig.test.json',
      '--jsdom',
      '--no-jest-preset',
      '--allow-js',
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
          `const tsJest = require('ts-jest').createJestPreset({ allowJs: true });

module.exports = {
  ...tsJest,
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
        log: `[level:20] creating jest presets handling JavaScript files
`,
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
    "testMatch": [
      "**/__tests__/**/*.js?(x)",
      "**/?(*.)+(spec|test).js?(x)",
      "**/__tests__/**/*.ts?(x)",
      "**/?(*.)+(spec|test).ts?(x)"
    ],
    "moduleFileExtensions": [
      "js",
      "json",
      "jsx",
      "node",
      "ts",
      "tsx"
    ],
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
  })
  describe('migrate', async () => {
    const pkgPaths = {
      withoutOptions: './a/package.json',
      withOptions: './b/package.json',
    }
    const noOption = ['config:migrate']
    const fullOptions = [...noOption, '--no-jest-preset', '--allow-js']
    beforeEach(() => {
      mockedProcess.cwd.mockImplementation(() => __dirname)
    })

    it('should migrate from package.json (without options)', async () => {
      expect.assertions(2)
      fs.existsSync.mockImplementation(() => true)
      jest.mock(
        pkgPaths.withoutOptions,
        () => ({
          jest: { globals: { __TS_CONFIG__: { target: 'es6' } } },
        }),
        { virtual: true },
      )
      const res = await runCli(...noOption, pkgPaths.withoutOptions)
      expect(res).toMatchInlineSnapshot(`
Object {
  "exitCode": 0,
  "log": "[level:20] creating jest presets not handling JavaScript files
",
  "stderr": "
Migrated Jest configuration:
",
  "stdout": "{
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
        pkgPaths.withOptions,
        () => ({
          jest: { globals: { __TS_CONFIG__: { target: 'es6' } } },
        }),
        { virtual: true },
      )
      const res = await runCli(...fullOptions, pkgPaths.withOptions)
      expect(res).toMatchInlineSnapshot(`
Object {
  "exitCode": 0,
  "log": "[level:20] creating jest presets handling JavaScript files
",
  "stderr": "
Migrated Jest configuration:
",
  "stdout": "{
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
  })
})
