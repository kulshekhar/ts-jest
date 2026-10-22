import { LogContexts, LogLevels, createLogger } from 'bs-logger'

export const rootLogger = createLogger({
  context: {
    [LogContexts.package]: 'ts-jest',
    [LogContexts.logLevel]: LogLevels.trace,
    version: require('../../package.json').version,
  },
  targets: process.env.TS_JEST_LOG ?? undefined,
})
