import { format } from 'util'

export let DEBUG_MODE!: boolean

export let debug!: typeof console.log
export let warn!: typeof console.warn

export let wrapWithDebug!: <T extends (...args: any[]) => any>(
  msg: string,
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
  if (kind === 'warn') {
    process.stderr.write(format(msg, ...args) + '\n')
  } else if (kind) {
    process.stdout.write(format(msg, ...args) + '\n')
  }
}

interface SetupOptions {
  enabled?: boolean
  logger?: Logger
  prefix?: string
}
export function __setup({
  logger = defaultLogger,
  enabled = !!process.env.TS_JEST_DEBUG || logger !== defaultLogger,
  prefix = 'ts-jest:',
}: SetupOptions = {}) {
  DEBUG_MODE = enabled
  LOG_PREFIX = prefix

  debug = DEBUG_MODE
    ? (...args: any[]) => logger('log', LOG_PREFIX, ...args)
    : () => undefined

  warn = (...args: any[]) => logger('warn', LOG_PREFIX, ...args)

  wrapWithDebug = DEBUG_MODE
    ? (msg, func) =>
        function wrapper(this: any) {
          logger('log', LOG_PREFIX, msg)
          return func.apply(this, arguments)
        } as any
    : (_, func) => func
}

__setup()
