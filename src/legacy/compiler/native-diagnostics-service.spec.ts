import { testing } from 'bs-logger'
import ts from 'typescript'

import {
  mapNativeDiagnostics,
  NativeDiagnostic,
  NativeDiagnosticsService,
  NativeProject,
  NativeSnapshot,
  probeNativeApi,
} from './native-diagnostics-service'

const logger = testing.createLoggerMock()

beforeEach(() => {
  logger.target.clear()
})

describe('probeNativeApi', () => {
  it('should report unavailable with the loader error as reason', () => {
    const result = probeNativeApi(() => {
      throw new Error("Cannot find module 'typescript/unstable/sync'\nRequire stack: ...")
    })

    expect(result).toEqual({ available: false, reason: "Cannot find module 'typescript/unstable/sync'" })
  })

  it('should report unavailable when the module has no API constructor', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = probeNativeApi(() => ({} as any))

    expect(result.available).toBe(false)
  })

  it('should report available when the module exposes an API constructor', () => {
    class FakeApi {
      close(): void {
        // noop
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = probeNativeApi(() => ({ API: FakeApi } as any))

    expect(result.available).toBe(true)
  })
})

describe('mapNativeDiagnostics', () => {
  const fileName = '/project/src/foo.ts'
  const fileContent = 'const a: number = "oops"\n'
  const readFile = (name: string) => (name === fileName ? fileContent : undefined)

  it('should map a plain diagnostic to the classic shape with a real source file', () => {
    const native: NativeDiagnostic[] = [
      { fileName, pos: 6, end: 7, code: 2322, category: ts.DiagnosticCategory.Error, text: 'nope' },
    ]
    const [mapped] = mapNativeDiagnostics(native, ts, readFile)

    expect(mapped.code).toBe(2322)
    expect(mapped.category).toBe(ts.DiagnosticCategory.Error)
    expect(mapped.messageText).toBe('nope')
    expect(mapped.start).toBe(6)
    expect(mapped.length).toBe(1)
    expect(mapped.file?.fileName).toBe(fileName)
    expect(mapped.file?.text).toBe(fileContent)
    // the produced diagnostic must be formattable by the classic pretty formatter
    const formatted = ts.formatDiagnosticsWithColorAndContext([mapped], {
      getNewLine: () => '\n',
      getCurrentDirectory: () => '/project',
      getCanonicalFileName: (path) => path,
    })
    expect(formatted).toContain('TS2322')
  })

  it('should map a message chain recursively', () => {
    const native: NativeDiagnostic[] = [
      {
        fileName,
        pos: 0,
        end: 5,
        code: 2345,
        category: ts.DiagnosticCategory.Error,
        text: 'outer',
        messageChain: [
          {
            fileName,
            pos: 0,
            end: 5,
            code: 2322,
            category: ts.DiagnosticCategory.Message,
            text: 'inner',
            messageChain: [
              { fileName, pos: 0, end: 5, code: 2320, category: ts.DiagnosticCategory.Message, text: 'innermost' },
            ],
          },
        ],
      },
    ]
    const [mapped] = mapNativeDiagnostics(native, ts, readFile)
    const chain = mapped.messageText as ts.DiagnosticMessageChain

    expect(chain.messageText).toBe('outer')
    expect(chain.code).toBe(2345)
    expect(chain.next?.[0].messageText).toBe('inner')
    expect(chain.next?.[0].next?.[0].messageText).toBe('innermost')
  })

  it('should map diagnostics without a file or with unreadable file content', () => {
    const native: NativeDiagnostic[] = [
      { pos: 0, end: 0, code: 5023, category: ts.DiagnosticCategory.Error, text: 'config error' },
      { fileName: '/gone.ts', pos: 3, end: 4, code: 2322, category: ts.DiagnosticCategory.Error, text: 'nope' },
    ]
    const [noFile, unreadable] = mapNativeDiagnostics(native, ts, readFile)

    expect(noFile.file).toBeUndefined()
    expect(noFile.start).toBeUndefined()
    expect(unreadable.file).toBeUndefined()
    expect(unreadable.start).toBeUndefined()
    expect(unreadable.code).toBe(2322)
  })
})

describe('NativeDiagnosticsService', () => {
  const tsconfigPath = '/project/tsconfig.json'
  const inProjectFile = '/project/src/in-project.ts'
  const orphanFile = '/project/orphan.spec.ts'

  interface FakeServerSetup {
    projectFiles?: string[]
    diagnosticsByFile?: Record<string, NativeDiagnostic[]>
    openFilesResolveToInferredProject?: boolean
  }

  const createFakeServer = ({
    projectFiles = [inProjectFile],
    diagnosticsByFile = {},
    openFilesResolveToInferredProject = true,
  }: FakeServerSetup = {}) => {
    const files = new Set(projectFiles)
    const calls = {
      constructed: 0,
      updateSnapshot: [] as unknown[],
      closed: 0,
      disposedSnapshots: 0,
    }
    const project: NativeProject = {
      configFileName: tsconfigPath,
      program: {
        getSyntacticDiagnostics: (file?: string) =>
          (file ? diagnosticsByFile[file] ?? [] : []).filter((d) => d.code === 1005),
        getSemanticDiagnostics: (file?: string) =>
          (file ? diagnosticsByFile[file] ?? [] : []).filter((d) => d.code !== 1005),
      },
    }
    const makeSnapshot = (): NativeSnapshot => ({
      getProjects: () => [project],
      getDefaultProjectForFile: (file: string) => (files.has(file) ? project : undefined),
      dispose: () => {
        calls.disposedSnapshots++
      },
    })
    class FakeApi {
      constructor() {
        calls.constructed++
      }
      updateSnapshot(params?: unknown): NativeSnapshot {
        calls.updateSnapshot.push(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const openFiles: string[] | undefined = (params as any)?.openFiles
        if (openFiles && openFilesResolveToInferredProject) {
          openFiles.forEach((file) => files.add(file))
        }

        return makeSnapshot()
      }
      close(): void {
        calls.closed++
      }
    }

    return { loader: () => ({ API: FakeApi }), calls }
  }

  const createService = (setup: FakeServerSetup = {}) => {
    const { loader, calls } = createFakeServer(setup)
    const service = new NativeDiagnosticsService({
      ts,
      logger,
      cwd: '/project',
      tsconfigPath,
      readFile: () => 'const a = 1\n',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadApi: loader as any,
    })

    return { service, calls }
  }

  it('should lazily spawn the server and open the project on the first check', () => {
    const { service, calls } = createService()

    expect(calls.constructed).toBe(0)

    service.check(inProjectFile)

    expect(calls.constructed).toBe(1)
    expect(calls.updateSnapshot[0]).toEqual({ openProjects: [tsconfigPath] })

    service.check(inProjectFile)

    expect(calls.constructed).toBe(1)
  })

  it('should return mapped syntactic + semantic diagnostics for an in-project file', () => {
    const { service } = createService({
      diagnosticsByFile: {
        [inProjectFile]: [
          { fileName: inProjectFile, pos: 0, end: 1, code: 1005, category: ts.DiagnosticCategory.Error, text: 'syn' },
          { fileName: inProjectFile, pos: 2, end: 3, code: 2322, category: ts.DiagnosticCategory.Error, text: 'sem' },
        ],
      },
    })
    const diagnostics = service.check(inProjectFile)

    expect(diagnostics.map((d) => d.code)).toEqual([1005, 2322])
    expect(diagnostics.map((d) => d.messageText)).toEqual(['syn', 'sem'])
  })

  it('should open out-of-project files via openFiles and check them', () => {
    const { service, calls } = createService({
      diagnosticsByFile: {
        [orphanFile]: [
          { fileName: orphanFile, pos: 0, end: 1, code: 2322, category: ts.DiagnosticCategory.Error, text: 'sem' },
        ],
      },
    })
    const diagnostics = service.check(orphanFile)

    expect(calls.updateSnapshot[1]).toEqual({ openFiles: [orphanFile] })
    expect(diagnostics.map((d) => d.code)).toEqual([2322])
  })

  it('should warn once and return no diagnostics for files no project can resolve', () => {
    const { service } = createService({ openFilesResolveToInferredProject: false })

    expect(service.check(orphanFile)).toEqual([])
    expect(service.check(orphanFile)).toEqual([])
    expect(logger.target.lines.warn).toHaveLength(1)
  })

  it('should refresh the snapshot (and dispose the previous one) on invalidate', () => {
    const { service, calls } = createService()
    service.check(inProjectFile)

    service.invalidate([inProjectFile])

    expect(calls.updateSnapshot[1]).toEqual({ fileChanges: { changed: [inProjectFile] } })
    expect(calls.disposedSnapshots).toBe(1)
  })

  it('should do nothing on invalidate before the server was ever spawned', () => {
    const { service, calls } = createService()

    service.invalidate([inProjectFile])

    expect(calls.constructed).toBe(0)
    expect(calls.updateSnapshot).toHaveLength(0)
  })

  it('should close the server on dispose', () => {
    const { service, calls } = createService()
    service.check(inProjectFile)

    service.dispose()

    expect(calls.closed).toBe(1)

    // and re-spawn cleanly if used again
    service.check(inProjectFile)

    expect(calls.constructed).toBe(2)
  })
})
