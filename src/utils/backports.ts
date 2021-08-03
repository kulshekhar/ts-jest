import type { Config } from '@jest/types'
import { LogContexts, Logger } from 'bs-logger'

import { Deprecations, Helps, interpolate } from './messages'

const context = { [LogContexts.namespace]: 'backports' }

/**
 * @internal
 */
export const backportJestConfig = <T extends Config.InitialOptions | Config.ProjectConfig>(
  logger: Logger,
  config: T,
): T => {
  logger.debug({ ...context, config }, 'backporting config')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { globals = {} } = (config || {}) as any
  const { 'ts-jest': tsJest = {} } = globals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergeTsJest: any = {}
  let hadWarnings = false
  const warnConfig = (oldPath: string, newPath: string, note?: string) => {
    hadWarnings = true
    logger.warn(
      context,
      interpolate(note ? Deprecations.ConfigOptionWithNote : Deprecations.ConfigOption, {
        oldPath,
        newPath,
        note,
      }),
    )
  }

  if ('__TS_CONFIG__' in globals) {
    warnConfig('globals.__TS_CONFIG__', 'globals.ts-jest.tsconfig')
    if (typeof globals.__TS_CONFIG__ === 'object') {
      mergeTsJest.tsconfig = globals.__TS_CONFIG__
    }
    delete globals.__TS_CONFIG__
  }

  if ('__TRANSFORM_HTML__' in globals) {
    warnConfig('globals.__TRANSFORM_HTML__', 'globals.ts-jest.stringifyContentPathRegex')
    if (globals.__TRANSFORM_HTML__) {
      mergeTsJest.stringifyContentPathRegex = '\\.html?$'
    }
    delete globals.__TRANSFORM_HTML__
  }

  if ('typeCheck' in tsJest) {
    warnConfig('globals.ts-jest.typeCheck', 'globals.ts-jest.isolatedModules')
    mergeTsJest.isolatedModules = !tsJest.typeCheck
    delete tsJest.typeCheck
  }

  if ('tsConfigFile' in tsJest) {
    warnConfig('globals.ts-jest.tsConfigFile', 'globals.ts-jest.tsconfig')
    if (tsJest.tsConfigFile) {
      mergeTsJest.tsconfig = tsJest.tsConfigFile
    }
    delete tsJest.tsConfigFile
  }

  if ('tsConfig' in tsJest) {
    warnConfig('globals.ts-jest.tsConfig', 'globals.ts-jest.tsconfig')
    if (tsJest.tsConfig) {
      mergeTsJest.tsconfig = tsJest.tsConfig
    }
    delete tsJest.tsConfig
  }

  if ('enableTsDiagnostics' in tsJest) {
    warnConfig('globals.ts-jest.enableTsDiagnostics', 'globals.ts-jest.diagnostics')
    if (tsJest.enableTsDiagnostics) {
      mergeTsJest.diagnostics = { warnOnly: true }
      if (typeof tsJest.enableTsDiagnostics === 'string') mergeTsJest.diagnostics.exclude = [tsJest.enableTsDiagnostics]
    } else {
      mergeTsJest.diagnostics = false
    }
    delete tsJest.enableTsDiagnostics
  }

  if ('useBabelrc' in tsJest) {
    warnConfig('globals.ts-jest.useBabelrc', 'globals.ts-jest.babelConfig', Deprecations.ConfigOptionUseBabelRcNote)
    if (tsJest.useBabelrc != null) {
      mergeTsJest.babelConfig = tsJest.useBabelrc ? true : {}
    }
    delete tsJest.useBabelrc
  }

  if ('skipBabel' in tsJest) {
    warnConfig('globals.ts-jest.skipBabel', 'globals.ts-jest.babelConfig')
    if (tsJest.skipBabel === false && !mergeTsJest.babelConfig) {
      mergeTsJest.babelConfig = true
    }
    delete tsJest.skipBabel
  }

  // if we had some warnings we can inform the user about the CLI tool
  if (hadWarnings) {
    logger.warn(context, Helps.MigrateConfigUsingCLI)
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(config as any),
    globals: {
      ...globals,
      'ts-jest': {
        ...mergeTsJest,
        ...tsJest,
      },
    },
  }
}

/**
 * @internal
 */
export const backportTsJestDebugEnvVar = (logger: Logger): void => {
  if ('TS_JEST_DEBUG' in process.env) {
    const shouldLog = !/^\s*(?:0|f(?:alse)?|no?|disabled?|off|)\s*$/i.test(process.env.TS_JEST_DEBUG || '')
    delete process.env.TS_JEST_DEBUG
    if (shouldLog) {
      process.env.TS_JEST_LOG = 'ts-jest.log,stderr:warn'
    }
    logger.warn(
      context,
      interpolate(Deprecations.EnvVar, {
        old: 'TS_JEST_DEBUG',
        new: 'TS_JEST_LOG',
      }),
    )
  }
}
