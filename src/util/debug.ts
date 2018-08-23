import { format } from 'util'
import { resolve } from 'path'
import { appendFileSync } from 'fs'

export let DEBUG_MODE!: boolean

export let debug!: typeof console.log
export let warn!: typeof console.warn

export let wrapWithDebug!: <T extends (...args: any[]) => any>(
  msg: string | string[] | ((...args: any[]) => string | string[]),
  func: T,
) => T

type LogKind = 'log' | 'warn'
type Logger = (kind: LogKind, ...args: any[]) => void

export let LOG_PREFIX = 'ts-jest:'

export const defaultLogger: Logger = (
  kind: LogKind,
  msg: string = '',
  ...args: any[]
) => {
  // we use stderr/stdout dirrectly so that the log won't be swallowed by jest
  // the dummy calback is to ensure output on CI with node 6
  if (kind === 'warn') {
    process.stderr.write(format(msg, ...args) + '\n', () => undefined)
  } else if (kind) {
    process.stdout.write(format(msg, ...args) + '\n', () => undefined)
  }
}

let writeLogToFile: string | undefined
const markedLogFiles: { [path: string]: 0 } = Object.create(null)

const time = () => new Date().toISOString()
const arrify = (
  input: string | string[] | ((...a: any[]) => string | string[]),
  args: any[],
) => {
  const strOrArray = typeof input === 'function' ? input(...args) : input
  return Array.isArray(strOrArray) ? strOrArray : [strOrArray]
}

interface SetupOptions {
  enabled?: boolean
  logger?: Logger
  prefix?: string
  logFile?: string | false
}
export function __setup({
  logger = defaultLogger,
  logFile = process.env.TS_JEST_DEBUG || process.env.TS_JEST_DEBUG_FILE
    ? resolve(
        process.cwd(),
        process.env.TS_JEST_DEBUG_FILE || 'ts-jest-debug.log',
      )
    : undefined,
  enabled = !!process.env.TS_JEST_DEBUG || logger !== defaultLogger,
  prefix = 'ts-jest:',
}: SetupOptions = {}) {
  writeLogToFile = logFile || undefined
  DEBUG_MODE = enabled
  LOG_PREFIX = prefix

  // wrap logger so that we write to file as well
  if (writeLogToFile) {
    logger = (old => (kind: LogKind, ...args: [any, ...any[]]) => {
      const prefix = `[${time()}][${kind}]`
      const message = format(...args)
      appendFileSync(
        writeLogToFile as string,
        `${prefix} ${message.replace(/\n/g, '\\n')}\n`,
        'utf8',
      )
      // call the original logger only if debug enabled
      if (enabled) old(kind, ...args)
    })(logger)
  }

  // log debug
  debug =
    DEBUG_MODE || writeLogToFile
      ? (...args: any[]) => logger('log', LOG_PREFIX, ...args)
      : () => undefined

  // log warning
  warn = (...args: any[]) => logger('warn', LOG_PREFIX, ...args)

  // function wrapper
  wrapWithDebug =
    DEBUG_MODE || writeLogToFile
      ? (msg, func) =>
          function wrapper(this: any) {
            logger('log', LOG_PREFIX, ...arrify(msg, [...arguments]))
            return func.apply(this, arguments)
          } as any
      : (_, func) => func

  // mark log file
  if (writeLogToFile && !(writeLogToFile in markedLogFiles)) {
    markedLogFiles[writeLogToFile] = 0
    debug('initiailized')
  }
}

__setup()
