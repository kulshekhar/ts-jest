import * as path from 'path'

import type { Config } from '@jest/types'
import { ExecaReturnValue, sync as spawnSync, SyncOptions } from 'execa'
import * as fs from 'graceful-fs'

import { version } from '../package.json'

export const tsJestBundle = path.join(__dirname, '..', `ts-jest-${version}.tgz`)

interface RunResult extends ExecaReturnValue {
  status: number
  error: Error
}
export const run = (cmd: string, cwd?: Config.Path, env?: Record<string, string>): RunResult => {
  const args = cmd.split(/\s/).slice(1)
  const spawnOptions = { cwd, env, preferLocal: false, reject: false }
  const result = spawnSync(cmd.split(/\s/)[0], args, spawnOptions as SyncOptions) as RunResult

  // For compat with cross-spawn
  result.status = result.exitCode

  if (result.status !== 0) {
    const message = `
      ORIGINAL CMD: ${cmd}
      STDOUT: ${result.stdout}
      STDERR: ${result.stderr}
      STATUS: ${result.status}
      ERROR: ${result.error}
    `
    throw new Error(message)
  }

  return result
}

export const runNpmInstall = (cwd: Config.Path, env?: Record<string, string>): RunResult => {
  const lockfilePath = path.resolve(cwd, 'package-lock.json')
  let exists = true

  // If the lockfile doesn't exist, npm's project detection is confused. Just creating an empty file works
  if (!fs.existsSync(lockfilePath)) {
    exists = false
    fs.writeFileSync(lockfilePath, '')
  }

  return run(exists ? 'npm ci --no-optional' : 'npm i --no-optional', cwd, env)
}

const replaceTime = (str: string): string =>
  str.replace(/\d*\.?\d+ m?s\b/g, '<<REPLACED>>').replace(/, estimated <<REPLACED>>/g, '')

const removeFnNameNode10 = (str: string): string => str.replace('<anonymous>.test', '<anonymous>')

export const extractSummary = (stdout: string): { rest: string; summary: string } => {
  const match = stdout
    .replace(/(?:\\[rn])+/g, '\n')
    .match(/Test Suites:.*\nTests.*\nSnapshots.*\nTime.*(\nRan all test suites)*.*\n*$/gm)
  if (!match) {
    throw new Error(
      `
      Could not find test summary in the output.
      OUTPUT:
        ${stdout}
    `,
    )
  }

  const summary = replaceTime(match[0])

  const rest = stdout
    .replace(match[0], '')
    // remove all timestamps
    .replace(/\s*\(\d*\.?\d+ m?s\b\)$/gm, '')

  return {
    rest: removeFnNameNode10(rest.trim()),
    summary: summary.trim(),
  }
}

const sortTests = (stdout: string) =>
  removeFnNameNode10(
    stdout
      .split('\n')
      .reduce<string[][]>((tests, line) => {
        if (['RUNS', 'PASS', 'FAIL'].includes(line.slice(0, 4))) {
          tests.push([line])
        } else {
          tests[tests.length - 1].push(line)
        }

        return tests
      }, [])
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map((strings) => (strings.length > 1 ? `${strings.join('\n').trimRight()}\n` : strings[0]))
      .join('\n')
      .trim(),
  )

export const extractSortedSummary = (stdout: string): { rest: string; summary: string } => {
  const { rest, summary } = extractSummary(stdout)

  return {
    rest: sortTests(replaceTime(rest)),
    summary,
  }
}

export const extractSummaries = (stdout: string): Array<{ rest: string; summary: string }> => {
  const regex = /Test Suites:.*\nTests.*\nSnapshots.*\nTime.*(\nRan all test suites)*.*\n*$/gm

  let match = regex.exec(stdout)
  const matches: RegExpExecArray[] = []

  while (match) {
    matches.push(match)
    match = regex.exec(stdout)
  }

  return matches
    .map((currentMatch, i) => {
      const prevMatch = matches[i - 1]
      const start = prevMatch ? prevMatch.index + prevMatch[0].length : 0
      const end = currentMatch.index + currentMatch[0].length

      return { end, start }
    })
    .map(({ start, end }) => extractSortedSummary(stdout.slice(start, end)))
}

export const normalizeIcons = (str: string): string => {
  if (!str) {
    return str
  }

  // Make sure to keep in sync with `jest-cli/src/constants`
  return str.replace(new RegExp('\u00D7', 'g'), '\u2715').replace(new RegExp('\u221A', 'g'), '\u2713')
}
