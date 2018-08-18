import yn = require('yn')

export const DEBUG_MODE: boolean = yn(process.env.TS_JEST_DEBUG)

export const debug: typeof console.log = DEBUG_MODE
  ? (...args: any[]) => console.log('ts-jest', ...args)
  : () => undefined

export const wrapWithDebug: <T extends (...args: any[]) => any>(
  msg: string,
  func: T,
) => T = DEBUG_MODE
  ? (msg, func) =>
      function wrapper(this: any) {
        debug(msg)
        return func.apply(this, arguments)
      } as any
  : func => func

export const warn = (...msg: any[]) => {
  console.warn('ts-jest', ...msg)
}
