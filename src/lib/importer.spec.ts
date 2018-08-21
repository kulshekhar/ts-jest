// tslint:disable:max-line-length
import * as fakers from '../__helpers__/fakers'
import { __requireModule, Importer } from './importer'

const moduleNotFound = () => {
  throw new Error()
}

const requireModule = jest.fn(
  mod => (mod in modules ? modules[mod]() : moduleNotFound()),
)
__requireModule(requireModule as any)

let modules!: { [key: string]: () => any }
beforeEach(() => {
  modules = {}
  requireModule.mockClear()
})

describe('instance', () => {
  it('should create a singleton', () => {
    const v1 = Importer.instance
    const v2 = Importer.instance
    expect(Importer.instance).toBeInstanceOf(Importer)
    expect(v1).toBe(v2)
  })
})

describe('tryTheese', () => {
  it('tries until it find one not failing', () => {
    modules = {
      success: () => 'success',
    }
    expect(new Importer().tryThese('fail1', 'fail2', 'success')).toBe('success')
  })
})

describe('patcher', () => {
  const patch1 = jest.fn(mod => ({ ...mod, p1: true }))
  const patch2 = jest.fn(mod => ({ ...mod, p2: true }))

  it('should apply patches correctly', () => {
    const imp = new Importer({ foo: [patch1, patch2] })
    modules = {
      foo: () => ({ foo: true }),
      bar: () => ({ bar: true }),
    }
    expect(imp.tryThese('foo')).toEqual({ foo: true, p1: true, p2: true })
    expect(imp.tryThese('foo')).toEqual({ foo: true, p1: true, p2: true })

    expect(imp.tryThese('bar')).toEqual({ bar: true })

    // ensure cache has been used
    expect(patch1).toHaveBeenCalledTimes(1)
    expect(patch2).toHaveBeenCalledTimes(1)
  })
})

describe('babelCore', () => {
  it('should prefer legacy/bridge', () => {
    modules = {
      '@babel/core': () => '@babel/core',
      'babel-core': () => 'babel-core',
    }
    expect(new Importer().babelCore(fakers.importReason())).toBe('babel-core')
  })
  it('should fallback to 7 if legacy/bridge not found', () => {
    modules = {
      '@babel/core': () => '@babel/core',
    }
    expect(new Importer().babelCore(fakers.importReason())).toBe('@babel/core')
  })
  it('should fail with correct error message', () => {
    expect(() => new Importer().babelCore(fakers.importReason()))
      .toThrowErrorMatchingInlineSnapshot(`
"Unable to load any of these modules: \\"babel-core\\", \\"@babel/core\\". [[BECAUSE]]. To fix it:
    • for Babel 7: \`npm i -D babel-jest 'babel-core@^7.0.0-0' @babel/core\` (or \`yarn add --dev babel-jest 'babel-core@^7.0.0-0' @babel/core\`)
    • for Babel 6: \`npm i -D babel-jest babel-core\` (or \`yarn add --dev babel-jest babel-core\`)"
`)
  })
})

describe('babelJest', () => {
  it('should load babel-core', () => {
    const importBabel = jest.fn(() => 'babel-core')
    modules = {
      'babel-core': importBabel,
      'babel-jest': () => 'babel-jest',
    }
    expect(new Importer().babelJest(fakers.importReason())).toBe('babel-jest')
    expect(importBabel).toHaveBeenCalledTimes(1)
  })
})
