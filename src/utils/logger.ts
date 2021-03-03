import { LogContexts, LogLevels, createLogger } from 'bs-logger'

import { backportTsJestDebugEnvVar } from './backports'

const original = process.env.TS_JEST_LOG

const buildOptions = () => ({
  context: {
    [LogContexts.package]: 'ts-jest',
    [LogContexts.logLevel]: LogLevels.trace,
    version: require('../../package.json').version,
  },
  targets: process.env.TS_JEST_LOG || undefined,
})

export let rootLogger = createLogger(buildOptions())

backportTsJestDebugEnvVar(rootLogger)

// re-create the logger if the env var has been backported
if (original !== process.env.TS_JEST_LOG) {
  rootLogger = createLogger(buildOptions())
}
