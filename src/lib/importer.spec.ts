// tslint:disable:max-line-length
import * as fakers from '../__helpers__/fakers'
import mockThese from '../__helpers__/mock-there'
import { TsJestImporter } from './types'
import { ImportReasons } from './messages'

beforeEach(() => {
  jest.resetModules()
})

const moduleNotFound = () => {
  throw new Error()
}

type ImportFunc = <T>(r: ImportReasons) => T
const importer = (
  patches?: any
): TsJestImporter & { [K: string]: ImportFunc } => {
  const imp = require('./importer').importer
  if (patches) {
    imp._patches = patches
  }
  return imp
}

describe('tryTheese', () => {
  it('tries until it find one not failing', () => {
    mockThese({
      fail1: moduleNotFound,
      fail2: moduleNotFound,
      success: () => 'success'
    })
    expect(importer().tryThese('fail1', 'fail2', 'success')).toBe('success')
  })
})

describe('patcher', () => {
  const patch1 = jest.fn(mod => ({ ...mod, p1: true }))
  const patch2 = jest.fn(mod => ({ ...mod, p2: true }))

  it('should apply patches correctly', () => {
    const imp = importer({ foo: [patch1, patch2] })
    mockThese({ foo: () => ({ foo: true }), bar: () => ({ bar: true }) })
    expect(imp.tryThese('foo')).toEqual({ foo: true, p1: true, p2: true })
    expect(imp.tryThese('foo')).toEqual({ foo: true, p1: true, p2: true })

    expect(imp.tryThese('bar')).toEqual({ bar: true })

    // ensure cache has been used
    expect(patch1).toHaveBeenCalledTimes(1)
    expect(patch2).toHaveBeenCalledTimes(1)
  })
})

describe('babelCore', () => {
  it('should prefer babel 7', () => {
    mockThese(['@babel/core', 'babel-core'])
    expect(importer().babelCore(fakers.importReason())).toBe('@babel/core')
  })
  it('should fallback to logacy', () => {
    mockThese({
      'babel-core': () => 'babel-core',
      '@babel/core': moduleNotFound
    })
    expect(importer().babelCore(fakers.importReason())).toBe('babel-core')
  })
  it('should fail with correct error message', () => {
    mockThese({
      'babel-core': moduleNotFound,
      '@babel/core': moduleNotFound
    })
    expect(() => importer().babelCore(fakers.importReason()))
      .toThrowErrorMatchingInlineSnapshot(`
"Unable to load any of these modules: \\"@babel/core\\", \\"babel-core\\". [[BECAUSE]]. To fix it:
    • for Babel 7: \`npm i -D babel-jest 'babel-core@^7.0.0-0' @babel/core\` (or \`yarn add --dev babel-jest 'babel-core@^7.0.0-0' @babel/core\`)
    • for Babel 6: \`npm i -D babel-jest babel-core\` (or \`yarn add --dev babel-jest babel-core\`)"
`)
  })
})

describe('babelJest', () => {
  it('should load babel-core', () => {
    const importBabel = jest.fn(() => 'babel-core')
    mockThese({ 'babel-core': importBabel })
    importer().babelJest(fakers.importReason())
    expect(importBabel).toHaveBeenCalledTimes(1)
  })
})
