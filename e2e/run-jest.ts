import * as path from 'path'

import type { FormattedTestResults } from '@jest/test-result'
import execa from 'execa'
import * as fs from 'graceful-fs'
import semver from 'semver'
import stripAnsi from 'strip-ansi'

import { normalizeIcons } from './utils'

const JEST_PATH = path.resolve(__dirname, '../node_modules/jest/bin/jest.js')

type RunJestOptions = {
  nodeOptions?: string
  nodePath?: string
  skipPkgJsonCheck?: boolean // don't complain if can't find package.json
  stripAnsi?: boolean // remove colors from stdout and stderr,
  timeout?: number // kill the Jest process after X milliseconds
  env?: NodeJS.ProcessEnv
}

// return the result of the spawned process:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default function runJest(dir: string, args?: string[], options: RunJestOptions = {}): RunJestResult {
  return normalizeStdoutAndStderrOnResult(spawnJest(dir, args, options), options)
}

function spawnJest(dir: string, args?: string[], options?: RunJestOptions, spawnAsync?: false): RunJestResult
function spawnJest(dir: string, args?: string[], options?: RunJestOptions, spawnAsync?: true): execa.ExecaChildProcess

// Spawns Jest and returns either a Promise (if spawnAsync is true) or the completed child process
function spawnJest(
  dir: string,
  args: string[] = [],
  options: RunJestOptions = {},
  spawnAsync = false,
): execa.ExecaSyncReturnValue | execa.ExecaChildProcess {
  const isRelative = !path.isAbsolute(dir)

  if (isRelative) {
    dir = path.resolve(__dirname, dir)
  }

  const localPackageJson = path.resolve(dir, 'package.json')
  if (!options.skipPkgJsonCheck && !fs.existsSync(localPackageJson)) {
    throw new Error(
      `
      Make sure you have a local package.json file at
        "${localPackageJson}".
      Otherwise Jest will try to traverse the directory tree and find the
      global package.json, which will send Jest into infinite loop.
    `,
    )
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    FORCE_COLOR: '0',
    ...options.env,
  }

  if (options.nodeOptions) env['NODE_OPTIONS'] = options.nodeOptions
  if (options.nodePath) env['NODE_PATH'] = options.nodePath

  const spawnArgs = [JEST_PATH, ...args]
  const spawnOptions: execa.CommonOptions<string> = {
    cwd: dir,
    env,
    reject: false,
    timeout: options.timeout || 0,
  }

  return (spawnAsync ? execa : execa.sync)(process.execPath, spawnArgs, spawnOptions)
}

type RunJestResult = execa.ExecaReturnValue

interface RunJestJsonResult extends RunJestResult {
  json: FormattedTestResults
}

function normalizeStreamString(stream: string, options: RunJestOptions): string {
  if (options.stripAnsi) stream = stripAnsi(stream)
  stream = normalizeIcons(stream)

  return stream
}

function normalizeStdoutAndStderrOnResult(result: RunJestResult, options: RunJestOptions): RunJestResult {
  const stdout = normalizeStreamString(result.stdout, options)
  const stderr = normalizeStreamString(result.stderr, options)

  return { ...result, stderr, stdout }
}

// Runs `jest` with `--json` option and adds `json` property to the result obj.
//   'success', 'startTime', 'numTotalTests', 'numTotalTestSuites',
//   'numRuntimeErrorTestSuites', 'numPassedTests', 'numFailedTests',
//   'numPendingTests', 'testResults'
export const json = function (dir: string, args?: string[], options: RunJestOptions = {}): RunJestJsonResult {
  args = [...(args || []), '--json']
  const result = runJest(dir, args, options)
  try {
    return {
      ...result,
      json: JSON.parse(result.stdout || ''),
    }
  } catch (e) {
    throw new Error(
      `
      Can't parse JSON.
      ERROR: ${(e as Error).name} ${(e as Error).message}
      STDOUT: ${result.stdout}
      STDERR: ${result.stderr}
    `,
    )
  }
}

export const onNodeVersions = (versionRange: string, testBody: () => void): void => {
  const description = `on node ${versionRange}`
  if (semver.satisfies(process.versions.node, versionRange)) {
    // eslint-disable-next-line jest/valid-title
    describe(description, () => {
      testBody()
    })
  } else {
    // eslint-disable-next-line jest/valid-title,jest/no-disabled-tests
    describe.skip(description, () => {
      testBody()
    })
  }
}
