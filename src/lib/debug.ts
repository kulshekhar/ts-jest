export let DEBUG_MODE!: boolean

export let debug!: typeof console.log

export let wrapWithDebug!: <T extends (...args: any[]) => any>(
  msg: string,
  func: T,
) => T

export const warn = (...msg: any[]) => {
  console.warn('ts-jest', ...msg)
}

type LogKind = 'log' | 'warn' | 'debug' | 'info'
type Logger = (kind: LogKind, ...args: any[]) => void

export const defaultLogger: Logger = (kind: LogKind, ...args: any[]) => {
  console[kind](...args)
}

interface SetupOptions {
  enabled?: boolean
  logger?: Logger
}
export function __setup({
  logger = defaultLogger,
  enabled = !!process.env.TS_JEST_DEBUG || logger !== defaultLogger,
}: SetupOptions = {}) {
  DEBUG_MODE = enabled

  debug = DEBUG_MODE
    ? (...args: any[]) => logger('log', 'ts-jest', ...args)
    : () => undefined

  wrapWithDebug = DEBUG_MODE
    ? (msg, func) =>
        function wrapper(this: any) {
          debug(msg)
          return func.apply(this, arguments)
        } as any
    : (_, func) => func
}

__setup()
