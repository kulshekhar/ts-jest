import { LogContexts, Logger } from 'bs-logger'
import type { Arguments } from 'yargs'
import yargsParser from 'yargs-parser'

import { rootLogger } from '../utils'

const VALID_COMMANDS = ['help', 'config:migrate', 'config:init']

const logger = rootLogger.child({ [LogContexts.namespace]: 'cli', [LogContexts.application]: 'ts-jest' })

/**
 * @internal
 */
export type CliCommand = (argv: Arguments, logger: Logger) => Promise<void>

async function cli(args: string[]): Promise<void> {
  const parsedArgv = yargsParser(args, {
    boolean: ['dry-run', 'jest-preset', 'allow-js', 'diff', 'babel', 'force', 'jsdom'],
    string: ['tsconfig', 'js'],
    count: ['verbose'],
    alias: { verbose: ['v'] },
    default: { jestPreset: true, verbose: 0 },
    coerce: {
      js(val: string) {
        const res = val.trim().toLowerCase()
        if (!['babel', 'ts'].includes(res)) throw new Error(`The 'js' option must be 'babel' or 'ts', given: '${val}'.`)

        return res
      },
    },
  })

  // deprecated
  if (parsedArgv.allowJs != null) {
    if (parsedArgv.js) throw new Error("The 'allowJs' and 'js' options cannot be set together.")
    parsedArgv.js = parsedArgv.allowJs ? 'ts' : undefined
  }

  let command = parsedArgv._.shift() as string
  const isHelp = command === 'help'
  if (isHelp) command = parsedArgv._.shift() as string

  if (!VALID_COMMANDS.includes(command)) command = 'help'

  const { run, help }: { run: CliCommand; help: CliCommand } = require(`./${command.replace(/:/g, '/')}`)

  const cmd = isHelp && command !== 'help' ? help : run

  return cmd(parsedArgv, logger)
}

const errorHasMessage = (err: unknown): err is { message: string } => {
  if (typeof err !== 'object' || err === null) return false

  return 'message' in err
}

/**
 * @internal
 */
export async function processArgv(): Promise<void> {
  try {
    await cli(process.argv.slice(2))
    process.exit(0)
  } catch (err) {
    if (errorHasMessage(err)) {
      logger.fatal(err.message)
      process.exit(1)
    }
  }
}
