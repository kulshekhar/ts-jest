// tslint:disable:max-line-length
import * as fakers from '../__helpers__/fakers'

import { Importer, __requireModule } from './importer'

const moduleNotFound = (mod: string) => {
  const err: any = new Error(`Module not found: ${mod}.`)
  err.code = 'MODULE_NOT_FOUND'
  throw err
}
const fakeFullPath = (mod: string) => `/root/${mod}.js`
const requireModule = jest.fn(mod => (mod in modules ? modules[mod]() : moduleNotFound(mod)))
const resolveModule = jest.fn(mod => (mod in modules ? fakeFullPath(mod) : moduleNotFound(mod)))
__requireModule(requireModule as any, resolveModule)

let modules!: { [key: string]: () => any }
beforeEach(() => {
  modules = {}
  requireModule.mockClear()
  resolveModule.mockClear()
})

describe('instance', () => {
  it('should create a singleton', () => {
    const v1 = Importer.instance
    const v2 = Importer.instance
    expect(Importer.instance).toBeInstanceOf(Importer)
    expect(v1).toBe(v2)
  })
})

describe('tryThese', () => {
  it('should try until it finds one existing', () => {
    modules = {
      success: () => 'ok',
    }
    expect(new Importer().tryThese('missing1', 'missing2', 'success')).toMatchInlineSnapshot(`
Object {
  "exists": true,
  "exports": "ok",
  "given": "success",
  "path": "/root/success.js",
}
`)
  })
  it('should return the error when one is failing', () => {
    modules = {
      fail1: () => {
        throw new Error('foo')
      },
      success: () => 'ok',
    }
    const res = new Importer().tryThese('missing1', 'fail1', 'success')
    expect(res).toMatchObject({
      exists: true,
      error: expect.any(Error),
      given: 'fail1',
      path: fakeFullPath('fail1'),
    })
    expect(res).not.toHaveProperty('exports')
    expect((res as any).error.message).toMatch(/\bfoo\b/)
  })
})

describe('tryTheseOr', () => {
  it('should try until it find one not failing', () => {
    expect(new Importer().tryTheseOr(['fail1', 'fail2', 'success'])).toBeUndefined()
    expect(new Importer().tryTheseOr(['fail1', 'fail2', 'success'], 'foo')).toBe('foo')
    modules = {
      success: () => 'ok',
    }
    expect(new Importer().tryTheseOr(['fail1', 'fail2', 'success'])).toBe('ok')
    modules.fail2 = () => {
      throw new Error('foo')
    }
    expect(new Importer().tryTheseOr(['fail1', 'fail2', 'success'], 'bar', true)).toBe('bar')
  })
  it('should fail if one is throwing', () => {
    modules = {
      success: () => 'ok',
      fail2: () => {
        throw new Error('foo')
      },
    }
    expect(() => new Importer().tryTheseOr(['fail1', 'fail2', 'success'], 'bar')).toThrow(/\bfoo\b/)
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
    expect(imp.tryTheseOr('foo')).toEqual({ foo: true, p1: true, p2: true })
    expect(imp.tryTheseOr('foo')).toEqual({ foo: true, p1: true, p2: true })

    expect(imp.tryTheseOr('bar')).toEqual({ bar: true })

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
    expect(() => new Importer().babelCore(fakers.importReason())).toThrowErrorMatchingInlineSnapshot(`
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
