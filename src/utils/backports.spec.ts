import { inspect } from 'util'

import { testing } from 'bs-logger'
import set from 'lodash.set'

import { backportJestConfig } from './backports'

const logger = testing.createLoggerMock()
const logTarget = logger.target

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
