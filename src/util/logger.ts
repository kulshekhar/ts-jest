import { createLogger, LogContexts, LogLevels } from 'bs-logger'
import { backportTsJestDebugEnvVar } from './backports'

backportTsJestDebugEnvVar()

export const rootLogger = createLogger({
  context: {
    [LogContexts.package]: 'ts-jest',
    [LogContexts.logLevel]: LogLevels.trace,
  },
  targets: process.env.TS_JEST_LOG || undefined,
})
