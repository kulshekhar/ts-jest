import { createConfigSet } from '../../__helpers__/fakers'
import { logTargetMock } from '../../__helpers__/mocks'
import { probeNativeApi } from '../compiler/native-diagnostics-service'

jest.mock('../compiler/native-diagnostics-service', () => {
  const actual = jest.requireActual('../compiler/native-diagnostics-service')

  return {
    ...actual,
    probeNativeApi: jest.fn(() => ({ available: true, version: '7.0.2' })),
  }
})

const mockedProbe = jest.mocked(probeNativeApi)
const logTarget = logTargetMock()

beforeEach(() => {
  jest.clearAllMocks()
  logTarget.clear()
  mockedProbe.mockReturnValue({ available: true, version: '7.0.2' })
})

describe('ConfigSet with diagnostics.engine', () => {
  it('should default to the compiler engine without probing', () => {
    const configSet = createConfigSet({ tsJestConfig: { diagnostics: true } })

    expect(configSet.useNativeDiagnosticsEngine).toBe(false)
    expect(mockedProbe).not.toHaveBeenCalled()
  })

  it('should enable the native engine when requested and the native API is available', () => {
    const configSet = createConfigSet({ tsJestConfig: { diagnostics: { engine: 'native' } } })

    expect(mockedProbe).toHaveBeenCalledTimes(1)
    expect(configSet.useNativeDiagnosticsEngine).toBe(true)
  })

  it('should fall back to the compiler engine with a warning when the native API is unavailable', () => {
    mockedProbe.mockReturnValue({ available: false, reason: "Cannot find module 'typescript/unstable/sync'" })
    const configSet = createConfigSet({ tsJestConfig: { diagnostics: { engine: 'native' } } })

    expect(configSet.useNativeDiagnosticsEngine).toBe(false)
    expect(logTarget.lines.warn.last).toContain('Falling back to `diagnostics.engine: "compiler"`')
    expect(logTarget.lines.warn.last).toContain("Cannot find module 'typescript/unstable/sync'")
  })

  it('should ignore the native engine with a warning when isolatedModules disables type-checking', () => {
    const configSet = createConfigSet({
      tsJestConfig: { diagnostics: { engine: 'native' }, tsconfig: { isolatedModules: true } },
    })

    expect(configSet.useNativeDiagnosticsEngine).toBe(false)
    expect(mockedProbe).not.toHaveBeenCalled()
    expect(logTarget.lines.warn.last).toContain('isolatedModules')
  })

  it('should warn on an invalid engine value and use the compiler engine', () => {
    const configSet = createConfigSet({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tsJestConfig: { diagnostics: { engine: 'turbo' as any } },
    })

    expect(configSet.useNativeDiagnosticsEngine).toBe(false)
    expect(mockedProbe).not.toHaveBeenCalled()
    expect(logTarget.lines.warn.last).toContain('Invalid value for the ts-jest option `diagnostics.engine`')
  })

  it('should produce a different cacheSuffix when the engine flips', () => {
    const compilerEngineConfigSet = createConfigSet({ tsJestConfig: { diagnostics: { engine: 'compiler' } } })
    const nativeEngineConfigSet = createConfigSet({ tsJestConfig: { diagnostics: { engine: 'native' } } })

    expect(compilerEngineConfigSet.useNativeDiagnosticsEngine).toBe(false)
    expect(nativeEngineConfigSet.useNativeDiagnosticsEngine).toBe(true)
    expect(nativeEngineConfigSet.cacheSuffix).not.toEqual(compilerEngineConfigSet.cacheSuffix)
  })

  it('should produce a different cacheSuffix for different native compiler versions', () => {
    const first = createConfigSet({ tsJestConfig: { diagnostics: { engine: 'native' } } })
    mockedProbe.mockReturnValue({ available: true, version: '7.1.0' })
    const second = createConfigSet({ tsJestConfig: { diagnostics: { engine: 'native' } } })

    expect(first.cacheSuffix).not.toEqual(second.cacheSuffix)
  })
})
