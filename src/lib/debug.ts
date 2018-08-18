import yn = require('yn')

export let DEBUG_MODE!: boolean

export let debug!: typeof console.log

export let wrapWithDebug!: <T extends (...args: any[]) => any>(
  msg: string,
  func: T,
) => T

export const warn = (...msg: any[]) => {
  console.warn('ts-jest', ...msg)
}

export function __setup() {
  DEBUG_MODE = yn(process.env.TS_JEST_DEBUG)

  debug = DEBUG_MODE
    ? (...args: any[]) => console.log('ts-jest', ...args)
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
