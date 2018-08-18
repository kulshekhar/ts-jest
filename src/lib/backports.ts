import { interpolate, Deprecateds } from './messages'
import { warn } from './debug'

export function backportJestConfig<
  T extends jest.InitialOptions | jest.ProjectConfig
>(config: T = {} as any, silent = false): T {
  const { globals = {} } = config as any
  const { 'ts-jest': tsJest = {} } = globals as any
  const mergeTsJest: any = {}
  const warnConfig = silent
    ? () => undefined
    : (oldPath: string, newPath: string, note?: string) => {
        warn(
          interpolate(
            note ? Deprecateds.ConfigOptionWithNote : Deprecateds.ConfigOption,
            {
              oldPath,
              newPath,
              note
            }
          )
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
    warnConfig(
      'globals.__TRANSFORM_HTML__',
      'globals.ts-jest.stringifyContentPathRegex'
    )
    if (globals.__TRANSFORM_HTML__) {
      mergeTsJest.stringifyContentPathRegex = '\\.html?$'
    }
    delete globals.__TRANSFORM_HTML__
  }

  if ('tsConfigFile' in tsJest) {
    warnConfig('globals.ts-jest.tsConfigFile', 'globals.ts-jest.tsConfig')
    if (tsJest.tsConfigFile) {
      mergeTsJest.tsConfig = tsJest.tsConfigFile
    }
    delete tsJest.tsConfigFile
  }

  if ('enableTsDiagnostics' in tsJest) {
    warnConfig(
      'globals.ts-jest.enableTsDiagnostics',
      'globals.ts-jest.diagnostics'
    )
    if (tsJest.enableTsDiagnostics) {
      mergeTsJest.diagnostics =
        typeof tsJest.enableTsDiagnostics === 'string'
          ? { pathRegex: tsJest.enableTsDiagnostics }
          : true
    } else {
      mergeTsJest.diagnostics = false
    }
    delete tsJest.enableTsDiagnostics
  }

  if ('useBabelrc' in tsJest) {
    warnConfig(
      'globals.ts-jest.useBabelrc',
      'globals.ts-jest.babelConfig',
      Deprecateds.ConfigOptionUseBabelRcNote
    )
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
        ...tsJest
      }
    }
  }
}
