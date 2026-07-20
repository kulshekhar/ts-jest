import type { Logger } from 'bs-logger'
import type * as _ts from 'typescript'

import type { TTypeScript } from '../../types'

/**
 * Minimal structural typings for the native TypeScript (7+) synchronous API exposed at
 * `typescript/unstable/sync`. Kept structural on purpose: the API is officially unstable until
 * TypeScript 7.1, and ts-jest must build against the TypeScript 6 JS API typings.
 *
 * @internal
 */
export interface NativeDiagnostic {
  fileName?: string
  pos: number
  end: number
  code: number
  category: _ts.DiagnosticCategory
  text: string
  messageChain?: readonly NativeDiagnostic[]
}

/**
 * @internal
 */
export interface NativeProgram {
  getSyntacticDiagnostics(file?: string): readonly NativeDiagnostic[]
  getSemanticDiagnostics(file?: string): readonly NativeDiagnostic[]
}

/**
 * @internal
 */
export interface NativeProject {
  configFileName: string
  program: NativeProgram
}

/**
 * @internal
 */
export interface NativeSnapshot {
  getProjects(): readonly NativeProject[]
  getDefaultProjectForFile(file: string): NativeProject | undefined
  dispose(): void
}

/**
 * @internal
 */
export interface NativeUpdateSnapshotParams {
  openProjects?: string[]
  openFiles?: string[]
  fileChanges?: { changed?: string[]; deleted?: string[] } | { invalidateAll: true }
}

/**
 * @internal
 */
export interface NativeApi {
  updateSnapshot(params?: NativeUpdateSnapshotParams): NativeSnapshot
  close(): void
}

/**
 * @internal
 */
export interface NativeApiModule {
  API: new (options?: { cwd?: string }) => NativeApi
}

/**
 * @internal
 */
export type NativeApiLoader = () => NativeApiModule

const NATIVE_SYNC_API_SPECIFIER = 'typescript/unstable/sync'

/* istanbul ignore next (exercised via e2e fixtures — requires a native TypeScript install) */
const defaultLoadNativeApi: NativeApiLoader = () => {
  const resolved = require.resolve(NATIVE_SYNC_API_SPECIFIER, { paths: [process.cwd(), __dirname] })

  // Node >=20.19 / >=22.12 supports synchronous `require()` of ES modules, which is what the
  // native API entry point is. On older Node versions this throws `ERR_REQUIRE_ESM`, which the
  // caller converts into a graceful fallback to the classic engine.
  return require(resolved) as NativeApiModule
}

/**
 * @internal
 */
export type NativeApiProbeResult = { available: true; version: string } | { available: false; reason: string }

/**
 * Cheap availability probe for the native API: resolves and loads the client module but does NOT
 * spawn the native compiler process.
 *
 * @internal
 */
export function probeNativeApi(loadApi: NativeApiLoader = defaultLoadNativeApi): NativeApiProbeResult {
  let mod: NativeApiModule
  try {
    mod = loadApi()
  } catch (e) {
    return { available: false, reason: (e as Error).message.split('\n')[0] }
  }
  if (typeof mod?.API !== 'function') {
    return { available: false, reason: `'${NATIVE_SYNC_API_SPECIFIER}' resolved but did not expose an API constructor` }
  }
  let version = 'unknown'
  try {
    version = (
      require(require.resolve('typescript/package.json', { paths: [process.cwd(), __dirname] })) as { version: string }
    ).version
  } catch {
    // keep 'unknown'
  }

  return { available: true, version }
}

/**
 * Map diagnostics from the native wire shape (`{fileName, pos, end, code, category, text, messageChain}`)
 * to the classic Strada `ts.Diagnostic` shape (`{file, start, length, code, category, messageText}`), so
 * the whole existing reporting pipeline (`raiseDiagnostics`, `ignoreCodes`, `warnOnly`, `exclude`,
 * `formatDiagnostics[WithColorAndContext]`) keeps working untouched.
 *
 * `DiagnosticCategory` numeric values are identical on both sides (Warning=0, Error=1, Suggestion=2,
 * Message=3), so the category passes through as-is.
 *
 * @internal
 */
export function mapNativeDiagnostics(
  nativeDiagnostics: readonly NativeDiagnostic[],
  ts: TTypeScript,
  readFile: (fileName: string) => string | undefined,
): _ts.Diagnostic[] {
  const sourceFileCache = new Map<string, _ts.SourceFile | undefined>()
  const getSourceFile = (fileName: string | undefined): _ts.SourceFile | undefined => {
    if (!fileName) return undefined
    if (!sourceFileCache.has(fileName)) {
      const content = readFile(fileName)
      sourceFileCache.set(
        fileName,
        content === undefined ? undefined : ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest),
      )
    }

    return sourceFileCache.get(fileName)
  }
  const toMessageChain = (diagnostic: NativeDiagnostic): _ts.DiagnosticMessageChain => ({
    messageText: diagnostic.text,
    category: diagnostic.category,
    code: diagnostic.code,
    next: diagnostic.messageChain?.length ? diagnostic.messageChain.map(toMessageChain) : undefined,
  })

  return nativeDiagnostics.map((diagnostic) => {
    const file = getSourceFile(diagnostic.fileName)

    return {
      file,
      start: file ? diagnostic.pos : undefined,
      length: file ? diagnostic.end - diagnostic.pos : undefined,
      code: diagnostic.code,
      category: diagnostic.category,
      messageText: diagnostic.messageChain?.length ? toMessageChain(diagnostic) : diagnostic.text,
    }
  })
}

/**
 * @internal
 */
export interface NativeDiagnosticsServiceOptions {
  ts: TTypeScript
  logger: Logger
  cwd: string
  /** Path of the resolved tsconfig file, when it exists on disk */
  tsconfigPath: string | undefined
  readFile: (fileName: string) => string | undefined
  loadApi?: NativeApiLoader
}

/**
 * Per-worker type-checking service backed by the native TypeScript (7+) compiler, spoken to over
 * the synchronous stdio API. Owns exactly one native server process, spawned lazily on the first
 * check. JavaScript emit never goes through here — only diagnostics.
 *
 * @internal
 */
export class NativeDiagnosticsService {
  private _api: NativeApi | undefined
  private _snapshot: NativeSnapshot | undefined
  private readonly _openedFiles = new Set<string>()
  private readonly _unresolvableFiles = new Set<string>()
  /**
   * Default-project lookups round-trip to the server, so resolutions are cached per snapshot
   * (project handles are only valid within the snapshot that produced them).
   */
  private readonly _projectCache = new Map<string, NativeProject>()
  private readonly _logger: Logger

  constructor(private readonly _options: NativeDiagnosticsServiceOptions) {
    this._logger = _options.logger.child({ namespace: 'native-diagnostics' })
  }

  private _ensureSnapshot(): NativeSnapshot {
    if (!this._api) {
      const { API } = (this._options.loadApi ?? defaultLoadNativeApi)()
      this._logger.debug(
        { tsconfigPath: this._options.tsconfigPath },
        '_ensureSnapshot(): spawning native TypeScript API server',
      )
      this._api = new API({ cwd: this._options.cwd })
      this._snapshot = this._api.updateSnapshot(
        this._options.tsconfigPath ? { openProjects: [this._options.tsconfigPath] } : undefined,
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._snapshot!
  }

  private _replaceSnapshot(newSnapshot: NativeSnapshot): NativeSnapshot {
    const previous = this._snapshot
    this._snapshot = newSnapshot
    this._projectCache.clear()
    /* istanbul ignore next */
    try {
      previous?.dispose()
    } catch {
      // the server may already have released it
    }

    return newSnapshot
  }

  private _projectFor(fileName: string): NativeProject | undefined {
    let snapshot = this._ensureSnapshot()
    let project = this._projectCache.get(fileName) ?? snapshot.getDefaultProjectForFile(fileName)
    if (!project && !this._openedFiles.has(fileName)) {
      // Files outside the tsconfig file list (e.g. specs not covered by `include`) need an
      // explicit open; they resolve to a containing configured project or an inferred project.
      this._openedFiles.add(fileName)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      snapshot = this._replaceSnapshot(this._api!.updateSnapshot({ openFiles: [fileName] }))
      project = snapshot.getDefaultProjectForFile(fileName)
    }
    if (project) this._projectCache.set(fileName, project)

    return project
  }

  /**
   * Compute syntactic + semantic diagnostics for one file, mapped to the classic `ts.Diagnostic` shape.
   */
  check(fileName: string): _ts.Diagnostic[] {
    const project = this._projectFor(fileName)
    if (!project) {
      if (!this._unresolvableFiles.has(fileName)) {
        this._unresolvableFiles.add(fileName)
        this._logger.warn(
          { fileName },
          'check(): the native TypeScript API could not resolve a project for this file, skipping type-checking for it',
        )
      }

      return []
    }
    this._logger.debug({ fileName, project: project.configFileName }, 'check(): computing native diagnostics')
    const nativeDiagnostics = [
      ...project.program.getSyntacticDiagnostics(fileName),
      ...project.program.getSemanticDiagnostics(fileName),
    ]

    return mapNativeDiagnostics(nativeDiagnostics, this._options.ts, this._options.readFile)
  }

  /**
   * Tell the native server that files changed on disk (watch mode), producing a fresh snapshot.
   */
  invalidate(changedFiles: string[]): void {
    if (!this._api) return
    this._logger.debug({ changedFiles }, 'invalidate(): refreshing native snapshot')
    this._replaceSnapshot(this._api.updateSnapshot({ fileChanges: { changed: changedFiles } }))
  }

  dispose(): void {
    /* istanbul ignore next */
    try {
      this._api?.close()
    } catch {
      // the server process may already be gone; its stdio channel also kills it on process exit
    }
    this._api = undefined
    this._snapshot = undefined
  }
}
