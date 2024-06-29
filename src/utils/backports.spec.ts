import { inspect } from 'util'

import { testing } from 'bs-logger'

import { backportJestConfig } from './backports'

const logger = testing.createLoggerMock()
const logTarget = logger.target

function set<T>(obj: T, path: string | string[], value: unknown): T {
  if (!path) return obj

  if (!Array.isArray(path)) {
    path = path.toString().match(/[^.[\]]+/g) || []
  }

  path.reduce((acc, key, index) => {
    if (index === path.length - 1) {
      acc[key] = value
    } else if (!acc[key]) {
      acc[key] = {}
    }

    return acc[key]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, obj as Record<string, any>)

  return obj
}

beforeEach(() => {
  logTarget.clear()
})

describe('backportJestConfig', () => {
  const makeTestsFor = (oldPath: string, values: unknown[]) => {
    values.forEach((val) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let original: any

      beforeEach(() => {
        original = {}
        set(original, oldPath, val)
      })

      describe(`with "${oldPath}" set to ${inspect(val)}`, () => {
        it('should warn the user', () => {
          backportJestConfig(logger, original)

          expect(logTarget.lines.warn).toMatchSnapshot()
        }) // should warn the user

        it('should have changed the config correctly', () => {
          expect(original).toMatchSnapshot('before')
          expect(backportJestConfig(logger, original)).toMatchSnapshot('migrated')
        }) // should have changed the config
      }) // with xxx set to yyy
    }) // for
  } // makeTestsFor

  makeTestsFor('globals.__TS_CONFIG__', [{ foo: 'bar' }])

  makeTestsFor('globals.__TRANSFORM_HTML__', [true, false])

  makeTestsFor('globals.ts-jest.tsConfigFile', ['tsconfig.build.json'])

  makeTestsFor('globals.ts-jest.tsConfig', ['tsconfig.build.json'])

  makeTestsFor('globals.ts-jest.enableTsDiagnostics', [true, false, '\\.spec\\.ts$'])

  makeTestsFor('globals.ts-jest.useBabelrc', [true, false])

  makeTestsFor('globals.ts-jest.typeCheck', [true, false])

  makeTestsFor('globals.ts-jest.skipBabel', [true, false])
})
