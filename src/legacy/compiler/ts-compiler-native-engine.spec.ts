import { join } from 'path'

import ts from 'typescript'

import { makeCompiler } from '../../__helpers__/fakers'
import type { TsJestTransformerOptions } from '../../types'

import { NativeDiagnosticsService } from './native-diagnostics-service'

jest.mock('./native-diagnostics-service', () => {
  const actual = jest.requireActual('./native-diagnostics-service')

  return {
    ...actual,
    probeNativeApi: jest.fn(() => ({ available: true, version: '7.0.2' })),
    NativeDiagnosticsService: jest.fn().mockImplementation(() => ({
      check: jest.fn(() => []),
      invalidate: jest.fn(),
      dispose: jest.fn(),
    })),
  }
})

const mockedServiceCtor = jest.mocked(NativeDiagnosticsService)

const mockFolder = join(process.cwd(), 'src', '__mocks__')
const fileName = join(mockFolder, 'thing.ts')
const fileContent = 'const x = 1\n'

const typeError: ts.Diagnostic = {
  file: undefined,
  start: undefined,
  length: undefined,
  code: 2322,
  category: ts.DiagnosticCategory.Error,
  messageText: "Type 'string' is not assignable to type 'number'.",
}

const cjsTsconfig = { module: 'commonjs', target: 'es2015' } as TsJestTransformerOptions['tsconfig']

const createNativeCompiler = (diagnosticsOverrides: Record<string, unknown> = {}) =>
  makeCompiler({
    tsJestConfig: {
      tsconfig: cjsTsconfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diagnostics: { engine: 'native', ...diagnosticsOverrides } as any,
    },
  })

const lastServiceInstance = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockedServiceCtor.mock.results[mockedServiceCtor.mock.results.length - 1]?.value as any

beforeEach(() => {
  jest.clearAllMocks()
})

describe('TsCompiler with the native diagnostics engine', () => {
  it('should not construct a LanguageService and should create the native service instead', () => {
    const compiler = makeCompiler({
      tsJestConfig: {
        tsconfig: join(process.cwd(), 'tsconfig.json'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diagnostics: { engine: 'native' } as any,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((compiler as any)._languageService).toBeUndefined()
    expect(mockedServiceCtor).toHaveBeenCalledTimes(1)
    expect(mockedServiceCtor.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        cwd: expect.any(String),
        tsconfigPath: expect.stringContaining('tsconfig.json'),
      }),
    )
  })

  it('should pass the discovered tsconfig path to the native service even with inline tsconfig overrides', () => {
    createNativeCompiler()

    // inline `tsconfig` ts-jest options are overrides on top of the discovered tsconfig file; the
    // native server loads the project from that file (inline overrides are a documented limitation)
    expect(mockedServiceCtor.mock.calls[0][0].tsconfigPath).toContain('tsconfig.json')
  })

  it('should emit through the transpile path and consult the native checker', () => {
    const compiler = createNativeCompiler()
    const output = compiler.getCompiledOutput(fileContent, fileName, {
      depGraphs: new Map(),
      supportsStaticESM: false,
      watchMode: false,
    })

    expect(output.code).toContain('const x = 1')
    expect(lastServiceInstance().check).toHaveBeenCalledWith(fileName)
    expect(lastServiceInstance().invalidate).not.toHaveBeenCalled()
  })

  it('should raise native diagnostics like the language-service path (throwing on type errors)', () => {
    const compiler = createNativeCompiler()
    lastServiceInstance().check.mockReturnValue([typeError])

    expect(() =>
      compiler.getCompiledOutput(fileContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      }),
    ).toThrow("Type 'string' is not assignable to type 'number'.")
  })

  it('should honor diagnostics.ignoreCodes for native diagnostics', () => {
    const compiler = createNativeCompiler({ ignoreCodes: [2322] })
    lastServiceInstance().check.mockReturnValue([typeError])

    expect(() =>
      compiler.getCompiledOutput(fileContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      }),
    ).not.toThrow()
  })

  it('should only warn when diagnostics.warnOnly is enabled', () => {
    const compiler = createNativeCompiler({ warnOnly: true })
    lastServiceInstance().check.mockReturnValue([typeError])

    expect(() =>
      compiler.getCompiledOutput(fileContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      }),
    ).not.toThrow()
  })

  it('should return diagnostics instead of raising in ESM mode, for processAsync to raise', () => {
    const compiler = makeCompiler({
      tsJestConfig: {
        useESM: true,
        tsconfig: { module: 'esnext', target: 'es2019' } as TsJestTransformerOptions['tsconfig'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diagnostics: { engine: 'native' } as any,
      },
    })
    lastServiceInstance().check.mockReturnValue([typeError])

    const output = compiler.getCompiledOutput(fileContent, fileName, {
      depGraphs: new Map(),
      supportsStaticESM: true,
      watchMode: false,
    })

    expect(output.diagnostics).toEqual([typeError])
  })

  it('should invalidate the changed file in watch mode before checking', () => {
    const compiler = createNativeCompiler()
    compiler.getCompiledOutput(fileContent, fileName, {
      depGraphs: new Map(),
      supportsStaticESM: false,
      watchMode: true,
    })

    expect(lastServiceInstance().invalidate).toHaveBeenCalledWith([fileName])
    expect(lastServiceInstance().check).toHaveBeenCalledWith(fileName)
  })

  it('should re-check importers in watch mode when the changed file has errors and warnOnly is set', () => {
    const importerFile = join(mockFolder, 'importer.ts')
    const compiler = createNativeCompiler({ warnOnly: true })
    lastServiceInstance().check.mockReturnValue([typeError])
    const depGraphs = new Map([[importerFile, { fileContent: 'import "./thing"', resolvedModuleNames: [fileName] }]])

    compiler.getCompiledOutput(fileContent, fileName, {
      depGraphs,
      supportsStaticESM: false,
      watchMode: true,
    })

    expect(lastServiceInstance().check).toHaveBeenCalledWith(importerFile)
  })

  it('should delegate syntactic diagnostics to the native engine instead of the transpiler', () => {
    const brokenContent = 'const x: = {'
    // engine compiler + isolated transpile reports the syntax error itself...
    const compilerEngine = makeCompiler({
      tsJestConfig: { tsconfig: { ...(cjsTsconfig as object), isolatedModules: true } },
    })

    expect(() =>
      compilerEngine.getCompiledOutput(brokenContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      }),
    ).toThrow()

    // ...whereas with the native engine the transpiler stays silent and reporting is the checker's job
    const nativeEngine = createNativeCompiler()

    expect(() =>
      nativeEngine.getCompiledOutput(brokenContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      }),
    ).not.toThrow()
    expect(lastServiceInstance().check).toHaveBeenCalledWith(fileName)
  })
})
