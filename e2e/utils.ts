import fs from 'node:fs'
import path from 'node:path'

import execa from 'execa'

export const E2E_ROOT_DIR = path.resolve(__dirname)
export const PROJECT_ROOT_DIR = path.resolve(E2E_ROOT_DIR, '..')
export const TS_JEST_PATH = path.join(PROJECT_ROOT_DIR, 'dist', 'index.js')

export interface CommandResult {
  exitCode: number
  stderr: string
  stdout: string
}

const COMMAND_TIMEOUT = 120_000
const INSTALL_TIMEOUT = 150_000

export const getFixturePath = (fixtureName: string): string => {
  const fixturePath = path.join(E2E_ROOT_DIR, fixtureName)

  if (!fs.existsSync(path.join(fixturePath, 'package.json'))) {
    throw new Error(`E2E fixture ${fixtureName} must contain a package.json`)
  }

  return fixturePath
}

export const runCommand = async (
  command: string,
  args: string[],
  cwd = PROJECT_ROOT_DIR,
  timeout = COMMAND_TIMEOUT,
): Promise<CommandResult> => {
  const result = await execa(command, args, { cwd, reject: false, timeout })

  return {
    exitCode: result.exitCode ?? 1,
    stderr: result.timedOut ? `${result.stderr}\nCommand timed out after ${timeout}ms`.trim() : result.stderr,
    stdout: result.stdout,
  }
}

export const runNpmCi = async (fixtureName: string): Promise<void> => {
  const fixturePath = getFixturePath(fixtureName)

  if (!fs.existsSync(path.join(fixturePath, 'package-lock.json'))) {
    throw new Error(`E2E fixture ${fixtureName} must contain a package-lock.json before running npm ci`)
  }

  const result = await runCommand('npm', ['ci'], fixturePath, INSTALL_TIMEOUT)

  if (result.exitCode !== 0) {
    throw new Error(`npm ci failed for ${fixtureName}\n${result.stdout}\n${result.stderr}`)
  }
}
