import { backportJestConfig } from './backports'
import spyThese from '../__helpers__/spy-these'
import set from 'lodash.set'
import { inspect } from 'util'

const consoleSpies = spyThese(console, {
  warn: () => undefined,
})
afterEach(() => {
  consoleSpies.mockReset()
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
          expect(consoleSpies.warn).toHaveBeenCalledTimes(1)
          expect(consoleSpies.warn.mock.calls[0].join(' ')).toMatchSnapshot()
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

  makeTestsFor('globals.ts-jest.useBabelrc', 'globals.ts-jest.babelJest', [
    true,
    false,
  ])

  makeTestsFor('globals.ts-jest.babelConfig', 'globals.ts-jest.babelJest', [
    { foo: 'bar' },
  ])

  makeTestsFor('globals.ts-jest.skipBabel', 'globals.ts-jest.babelJest', [
    true,
    false,
  ])
})
