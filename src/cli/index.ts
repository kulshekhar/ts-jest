import { LogContexts, Logger } from 'bs-logger'
import { Arguments } from 'yargs'
import yargsParser from 'yargs-parser'

import { rootLogger } from '../util/logger'

const VALID_COMMANDS = ['help', 'config:migrate', 'config:init']

const logger = rootLogger.child({ [LogContexts.namespace]: 'cli', [LogContexts.application]: 'ts-jest' })

export type CliCommand = (argv: Arguments, logger: Logger) => Promise<void>

async function cli(args: string[]): Promise<void> {
  const parsedArgv = yargsParser(args, {
    boolean: ['dry-run', 'jest-preset', 'allow-js', 'diff', 'babel', 'force', 'jsdom'],
    string: ['tsconfig'],
    count: ['verbose'],
    alias: { verbose: ['v'] },
    default: { jestPreset: true, verbose: 0 },
  })

  let command = parsedArgv._.shift() as string
  const isHelp = command === 'help'
  if (isHelp) command = parsedArgv._.shift() as string

  if (!VALID_COMMANDS.includes(command)) command = 'help'

  // tslint:disable-next-line:no-var-requires
  const { run, help }: { run: CliCommand; help: CliCommand } = require(`./${command.replace(/:/g, '/')}`)

  const cmd = isHelp && command !== 'help' ? help : run

  return cmd(parsedArgv, logger)
}

export async function processArgv(): Promise<void> {
  try {
    await cli(process.argv.slice(2))
    process.exit(0)
  } catch (err) {
    logger.fatal(err.message)
    process.exit(1)
  }
}
