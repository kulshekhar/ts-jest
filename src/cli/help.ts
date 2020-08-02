import type { Arguments } from 'yargs'

/**
 * @internal
 */
export const run = async (_: Arguments): Promise<void> => {
  process.stdout.write(`
Usage:
  ts-jest command [options] [...args]

Commands:
  config:init           Creates initial Jest configuration
  config:migrate        Migrates a given Jest configuration
  help [command]        Show this help, or help about a command

Example:
  ts-jest help config:migrate
`)
}

/**
 * @internal
 */
export const help = run
