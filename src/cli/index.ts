import { LogContexts, Logger } from 'bs-logger'
import { Arguments } from 'yargs'
import yargsParser from 'yargs-parser'

import { rootLogger } from '../util/logger'

const VALID_COMMANDS = ['help', 'config:migrate']

// tslint:disable-next-line:prefer-const
let [, , ...args] = process.argv

const logger = rootLogger.child({ [LogContexts.namespace]: 'cli', [LogContexts.application]: 'ts-jest' })

const parsedArgv = yargsParser(args, {
  boolean: ['dryRun', 'jestPreset', 'allowJs', 'diff'],
  count: ['verbose'],
  alias: { verbose: ['v'] },
  default: { dryRun: false, jestPreset: true, allowJs: false, verbose: 0, diff: false },
})
let command = parsedArgv._.shift() as string
const isHelp = command === 'help'
if (isHelp) command = parsedArgv._.shift() as string

if (!VALID_COMMANDS.includes(command)) command = 'help'

export type CliCommand = (argv: Arguments, logger: Logger) => Promise<void>

// tslint:disable-next-line:no-var-requires
const { run, help }: { run: CliCommand; help: CliCommand } = require(`./${command.replace(/:/g, '/')}`)

const cmd = isHelp && command !== 'help' ? help : run

cmd(parsedArgv, logger).then(
  () => {
    process.exit(0)
  },
  (err: Error) => {
    logger.fatal(err.message)
    process.exit(1)
  },
)
