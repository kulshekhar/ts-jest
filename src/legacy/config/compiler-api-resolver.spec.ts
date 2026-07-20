import { testing } from 'bs-logger'

import type { TTypeScript } from '../../types'
import type { Importer, RequireResult } from '../../utils/importer'

import { hasJsCompilerApi, resolveCompilerApi, TYPESCRIPT6_COMPAT_PACKAGE } from './compiler-api-resolver'

const logger = testing.createLoggerMock()

const jsApiModule = (version: string): TTypeScript =>
  ({
    version,
    transpileModule: () => ({ outputText: '' }),
    createLanguageService: () => ({}),
    parseJsonConfigFileContent: () => ({}),
  } as unknown as TTypeScript)

const nativeV7Module = { version: '7.0.2' }

interface FakeImporterSetup {
  /** modules resolvable by name; absent name = module not installed */
  modules?: Record<string, unknown>
  /** module names which exist but fail while loading */
  loadErrors?: Record<string, Error>
}

const fakeImporter = ({ modules = {}, loadErrors = {} }: FakeImporterSetup): Importer => {
  const tryThese = (moduleName: string): RequireResult<true> | undefined => {
    if (loadErrors[moduleName]) {
      return { exists: true, given: moduleName, error: loadErrors[moduleName] }
    }
    if (moduleName in modules) {
      return { exists: true, given: moduleName, exports: modules[moduleName] }
    }

    return undefined
  }
  const typescript = (_why: string, which: string): TTypeScript => {
    const result = tryThese(which)
    if (result && !result.error) return result.exports as TTypeScript
    throw new Error(`Unable to load the module "${which}".`)
  }

  return { tryThese, typescript } as unknown as Importer
}

beforeEach(() => {
  logger.target.clear()
})

describe('hasJsCompilerApi', () => {
  it.each([
    [jsApiModule('5.9.3'), true],
    [jsApiModule('6.0.3'), true],
    [nativeV7Module, false],
    [undefined, false],
    [null, false],
    [{}, false],
    [{ transpileModule: () => ({}) }, false],
  ])('should feature-probe the JS compiler API surface (%#)', (mod, expected) => {
    expect(hasJsCompilerApi(mod)).toBe(expected)
  })
})

describe('resolveCompilerApi', () => {
  describe('with an explicit `compiler` option', () => {
    it('should use the requested module when it has a JS API', () => {
      const ttsc = jsApiModule('5.9.3')
      const result = resolveCompilerApi('ttypescript', logger, fakeImporter({ modules: { ttypescript: ttsc } }))

      expect(result.module).toBe(ttsc)
      expect(result.moduleName).toBe('ttypescript')
      expect(result.nativeTypeScriptPresent).toBe(false)
    })

    it('should throw an actionable error when the requested module has no JS API, never falling back', () => {
      const importer = fakeImporter({
        modules: { 'some-native-ts': nativeV7Module, [TYPESCRIPT6_COMPAT_PACKAGE]: jsApiModule('6.0.3') },
      })

      expect(() => resolveCompilerApi('some-native-ts', logger, importer)).toThrowErrorMatchingSnapshot()
    })
  })

  describe('without a `compiler` option', () => {
    it.each([undefined, 'typescript'])(
      'should use the project `typescript` when it still has the JS API (compiler option: %p)',
      (compilerOption) => {
        const ts = jsApiModule('5.9.3')
        const result = resolveCompilerApi(compilerOption, logger, fakeImporter({ modules: { typescript: ts } }))

        expect(result.module).toBe(ts)
        expect(result.moduleName).toBe('typescript')
        expect(result.nativeTypeScriptPresent).toBe(false)
        expect(result.nativeTypeScriptVersion).toBeUndefined()
      },
    )

    it('should fall back to the compat package when `typescript` is native v7', () => {
      const compat = jsApiModule('6.0.3')
      const result = resolveCompilerApi(
        undefined,
        logger,
        fakeImporter({ modules: { typescript: nativeV7Module, [TYPESCRIPT6_COMPAT_PACKAGE]: compat } }),
      )

      expect(result.module).toBe(compat)
      expect(result.moduleName).toBe(TYPESCRIPT6_COMPAT_PACKAGE)
      expect(result.nativeTypeScriptPresent).toBe(true)
      expect(result.nativeTypeScriptVersion).toBe('7.0.2')
      expect(logger.target.lines.info.last).toContain('@typescript/typescript6')
    })

    it('should use the compat package quietly when `typescript` is not installed at all', () => {
      const compat = jsApiModule('6.0.3')
      const result = resolveCompilerApi(
        undefined,
        logger,
        fakeImporter({ modules: { [TYPESCRIPT6_COMPAT_PACKAGE]: compat } }),
      )

      expect(result.module).toBe(compat)
      expect(result.moduleName).toBe(TYPESCRIPT6_COMPAT_PACKAGE)
      expect(result.nativeTypeScriptPresent).toBe(false)
      expect(logger.target.lines.info.last).toBeUndefined()
    })

    it('should throw an actionable error when `typescript` is native v7 and the compat package is missing', () => {
      const importer = fakeImporter({ modules: { typescript: nativeV7Module } })

      expect(() => resolveCompilerApi(undefined, logger, importer)).toThrowErrorMatchingSnapshot()
    })

    it('should keep the historical error when no typescript module can be found at all', () => {
      expect(() => resolveCompilerApi(undefined, logger, fakeImporter({}))).toThrow(
        'Unable to load the module "typescript".',
      )
    })

    it('should ignore a `typescript` module that exists but fails to load and use the compat package', () => {
      const compat = jsApiModule('6.0.3')
      const result = resolveCompilerApi(
        undefined,
        logger,
        fakeImporter({
          modules: { [TYPESCRIPT6_COMPAT_PACKAGE]: compat },
          loadErrors: { typescript: new Error('boom') },
        }),
      )

      expect(result.module).toBe(compat)
      expect(result.nativeTypeScriptPresent).toBe(false)
    })
  })
})
