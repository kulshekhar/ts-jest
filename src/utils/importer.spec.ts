import * as fakers from '../__helpers__/fakers'

import { Importer, __requireModule } from './importer'

const moduleNotFound = (mod: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err: any = new Error(`Module not found: ${mod}.`)
  err.code = 'MODULE_NOT_FOUND'
  throw err
}
const fakeFullPath = (mod: string) => `/root/${mod}.js`
const requireModule = jest.fn((mod) => (mod in modules ? modules[mod]() : moduleNotFound(mod)))
const resolveModule = jest.fn((mod) => (mod in modules ? fakeFullPath(mod) : moduleNotFound(mod)))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
__requireModule(requireModule as any, resolveModule)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const patch1 = jest.fn((mod) => ({ ...mod, p1: true }))
  const patch2 = jest.fn((mod) => ({ ...mod, p2: true }))

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
  it('should be @babel/core', () => {
    modules = {
      '@babel/core': () => '@babel/core',
    }
    expect(new Importer().babelCore(fakers.importReason())).toBe('@babel/core')
  })
  it('should fail with correct error message', () => {
    expect(() => new Importer().babelCore(fakers.importReason())).toThrowErrorMatchingInlineSnapshot(`
"Unable to load the module \\"@babel/core\\". [[BECAUSE]] To fix it:
    ↳ install \\"@babel/core\\": \`npm i -D @babel/core\` (or \`yarn add --dev @babel/core\`)"
`)
  })
})

describe('babelJest', () => {
  it('should be babel-jest', () => {
    modules = {
      'babel-jest': () => 'babel-jest',
    }
    expect(new Importer().babelJest(fakers.importReason())).toBe('babel-jest')
  })
  it('should fail with correct error message', () => {
    expect(() => new Importer().babelJest(fakers.importReason())).toThrowErrorMatchingInlineSnapshot(`
"Unable to load the module \\"babel-jest\\". [[BECAUSE]] To fix it:
    ↳ install \\"babel-jest\\": \`npm i -D babel-jest\` (or \`yarn add --dev babel-jest\`)"
`)
  })
})

describe('typescript', () => {
  it('should be typescript', () => {
    modules = {
      typescript: () => 'typescript',
    }
    expect(new Importer().typescript(fakers.importReason(), 'typescript')).toBe('typescript')
  })
})
