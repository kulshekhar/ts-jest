import { backportJestConfig } from './backports'
import set from 'lodash.set'
import { inspect } from 'util'
import { logTargetMock } from '../__helpers__/mocks'

const logTarget = logTargetMock()

beforeEach(() => {
  logTarget.clear()
})

describe('backportJestConfig', () => {
  const makeTestsFor = (oldPath: string, newPath: string, values: any[]) => {
    values.forEach(val => {
      let original: any
      beforeEach(() => {
        original = {}
        set(original, oldPath, val)
      })
      describe(`with "${oldPath}" set to ${inspect(val)}`, () => {
        it(`should wran the user`, () => {
          backportJestConfig(original)
          expect(logTarget.lines.warn.last).toMatchSnapshot()
        }) // should warn the user
        it(`should have changed the config correctly`, () => {
          expect(original).toMatchSnapshot('before')
          expect(backportJestConfig(original)).toMatchSnapshot('migrated')
        }) // should have changed the config
      }) // with xxx set to yyy
    }) // for
  } // makeTestsFor

  makeTestsFor('globals.__TS_CONFIG__', 'globals.ts-jest.tsConfig', [
    { foo: 'bar' },
  ])

  makeTestsFor(
    'globals.__TRANSFORM_HTML__',
    'globals.ts-jest.stringifyContentPathRegex',
    [true, false],
  )

  makeTestsFor('globals.ts-jest.tsConfigFile', 'globals.ts-jest.tsConfig', [
    'tsconfig.build.json',
  ])

  makeTestsFor(
    'globals.ts-jest.enableTsDiagnostics',
    'globals.ts-jest.diagnostics',
    [true, false, '\\.spec\\.ts$'],
  )

  makeTestsFor('globals.ts-jest.useBabelrc', 'globals.ts-jest.babelConfig', [
    true,
    false,
  ])

  makeTestsFor('globals.ts-jest.skipBabel', 'globals.ts-jest.babelConfig', [
    true,
    false,
  ])
})
