import { LogContexts, Logger } from 'bs-logger'

import { Deprecateds, interpolate } from './messages'

const context = { [LogContexts.namespace]: 'backports' }

export const backportJestConfig = <T extends jest.InitialOptions | jest.ProjectConfig>(
  logger: Logger,
  config: T,
): T => {
  logger.debug({ ...context, config }, 'backporting config')

  const { globals = {} } = (config || {}) as any
  const { 'ts-jest': tsJest = {} } = globals as any
  const mergeTsJest: any = {}
  const warnConfig = (oldPath: string, newPath: string, note?: string) => {
    logger.warn(
      context,
      interpolate(note ? Deprecateds.ConfigOptionWithNote : Deprecateds.ConfigOption, {
        oldPath,
        newPath,
        note,
      }),
    )
  }

  if ('__TS_CONFIG__' in globals) {
    warnConfig('globals.__TS_CONFIG__', 'globals.ts-jest.tsConfig')
    if (typeof globals.__TS_CONFIG__ === 'object') {
      mergeTsJest.tsConfig = globals.__TS_CONFIG__
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
    warnConfig('globals.ts-jest.tsConfigFile', 'globals.ts-jest.tsConfig')
    if (tsJest.tsConfigFile) {
      mergeTsJest.tsConfig = tsJest.tsConfigFile
    }
    delete tsJest.tsConfigFile
  }

  if ('enableTsDiagnostics' in tsJest) {
    warnConfig('globals.ts-jest.enableTsDiagnostics', 'globals.ts-jest.diagnostics')
    if (tsJest.enableTsDiagnostics) {
      mergeTsJest.diagnostics =
        typeof tsJest.enableTsDiagnostics === 'string' ? { pathRegex: tsJest.enableTsDiagnostics } : true
    } else {
      mergeTsJest.diagnostics = false
    }
    delete tsJest.enableTsDiagnostics
  }

  if ('useBabelrc' in tsJest) {
    warnConfig('globals.ts-jest.useBabelrc', 'globals.ts-jest.babelConfig', Deprecateds.ConfigOptionUseBabelRcNote)
    if (tsJest.useBabelrc != null) {
      mergeTsJest.babelConfig = tsJest.useBabelrc ? true : {}
    }
    delete tsJest.useBabelrc
  }

  // if ('babelConfig' in tsJest) {
  //   warnConfig('globals.ts-jest.babelConfig', 'globals.ts-jest.babelConfig')
  //   if (tsJest.babelConfig != null) {
  //     mergeTsJest.babelConfig = tsJest.babelConfig
  //   }
  //   delete tsJest.babelConfig
  // }

  if ('skipBabel' in tsJest) {
    warnConfig('globals.ts-jest.skipBabel', 'globals.ts-jest.babelConfig')
    if (tsJest.skipBabel === false && !mergeTsJest.babelConfig) {
      mergeTsJest.babelConfig = true
    }
    delete tsJest.skipBabel
  }

  return {
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

export const backportTsJestDebugEnvVar = (logger: Logger) => {
  if ('TS_JEST_DEBUG' in process.env) {
    const shouldLog = !/^\s*(?:0|f(?:alse)?|no?|disabled?|off|)\s*$/i.test(process.env.TS_JEST_DEBUG || '')
    delete process.env.TS_JEST_DEBUG
    if (shouldLog) {
      process.env.TS_JEST_LOG = `ts-jest.log,stderr:warn`
    }
    logger.warn(
      context,
      interpolate(Deprecateds.EnvVar, {
        old: 'TS_JEST_DEBUG',
        new: 'TS_JEST_LOG',
      }),
    )
  }
}
