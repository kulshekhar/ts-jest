export interface RawCompilerOptions {
  charset?: string
  composite?: boolean
  declaration?: boolean
  declarationDir?: string | null
  diagnostics?: boolean
  disableReferencedProjectLoad?: boolean
  emitBOM?: boolean
  emitDeclarationOnly?: boolean
  incremental?: boolean
  tsBuildInfoFile?: string
  inlineSourceMap?: boolean
  inlineSources?: boolean
  jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev' | 'react-native'
  reactNamespace?: string
  jsxFactory?: string
  jsxFragmentFactory?: string
  jsxImportSource?: string
  listFiles?: boolean
  mapRoot?: string
  module?: 'CommonJS' | 'AMD' | 'System' | 'UMD' | 'ES6' | 'ES2015' | 'ES2020' | 'ESNext' | 'None' | string
  moduleResolution?: 'Classic' | 'Node'
  newLine?: 'crlf' | 'lf'
  noEmit?: boolean
  noEmitHelpers?: boolean
  noEmitOnError?: boolean
  noImplicitAny?: boolean
  noImplicitThis?: boolean
  noUnusedLocals?: boolean
  noUnusedParameters?: boolean
  noLib?: boolean
  noResolve?: boolean
  noStrictGenericChecks?: boolean
  skipDefaultLibCheck?: boolean
  skipLibCheck?: boolean
  outFile?: string
  outDir?: string
  preserveConstEnums?: boolean
  preserveSymlinks?: boolean
  preserveWatchOutput?: boolean
  pretty?: boolean
  removeComments?: boolean
  rootDir?: string
  isolatedModules?: boolean
  sourceMap?: boolean
  sourceRoot?: string
  suppressExcessPropertyErrors?: boolean
  suppressImplicitAnyIndexErrors?: boolean
  target?: 'ES3' | 'ES5' | 'ES6' | 'ES2015' | 'ES2016' | 'ES2017' | 'ES2018' | 'ES2019' | 'ES2020' | 'ESNext' | string
  watch?: boolean
  fallbackPolling?: 'fixedPollingInterval' | 'priorityPollingInterval' | 'dynamicPriorityPolling'
  watchDirectory?: 'useFsEvents' | 'fixedPollingInterval' | 'dynamicPriorityPolling'
  watchFile?:
    | 'fixedPollingInterval'
    | 'priorityPollingInterval'
    | 'dynamicPriorityPolling'
    | 'useFsEvents'
    | 'useFsEventsOnParentDirectory'
  experimentalDecorators?: boolean
  emitDecoratorMetadata?: boolean
  allowUnusedLabels?: boolean
  noImplicitReturns?: boolean
  noUncheckedIndexedAccess?: boolean
  noFallthroughCasesInSwitch?: boolean
  allowUnreachableCode?: boolean
  forceConsistentCasingInFileNames?: boolean
  generateCpuProfile?: string
  baseUrl?: string
  paths?: {
    [k: string]: string[]
  }
  plugins?: {
    name?: string
    [k: string]: unknown
  }[]
  rootDirs?: string[]
  typeRoots?: string[]
  types?: string[]
  traceResolution?: boolean
  allowJs?: boolean
  noErrorTruncation?: boolean
  allowSyntheticDefaultImports?: boolean
  noImplicitUseStrict?: boolean
  listEmittedFiles?: boolean
  disableSizeLimit?: boolean
  lib?: (
    | 'ES5'
    | 'ES6'
    | 'ES2015'
    | 'ES2015.Collection'
    | 'ES2015.Core'
    | 'ES2015.Generator'
    | 'ES2015.Iterable'
    | 'ES2015.Promise'
    | 'ES2015.Proxy'
    | 'ES2015.Reflect'
    | 'ES2015.Symbol.WellKnown'
    | 'ES2015.Symbol'
    | 'ES2016'
    | 'ES2016.Array.Include'
    | 'ES2017'
    | 'ES2017.Intl'
    | 'ES2017.Object'
    | 'ES2017.SharedMemory'
    | 'ES2017.String'
    | 'ES2017.TypedArrays'
    | 'ES2018'
    | 'ES2018.AsyncGenerator'
    | 'ES2018.AsyncIterable'
    | 'ES2018.Intl'
    | 'ES2018.Promise'
    | 'ES2018.Regexp'
    | 'ES2019'
    | 'ES2019.Array'
    | 'ES2019.Object'
    | 'ES2019.String'
    | 'ES2019.Symbol'
    | 'ES2020'
    | 'ES2020.BigInt'
    | 'ES2020.Promise'
    | 'ES2020.String'
    | 'ES2020.Symbol.WellKnown'
    | 'ESNext'
    | 'ESNext.Array'
    | 'ESNext.AsyncIterable'
    | 'ESNext.BigInt'
    | 'ESNext.Intl'
    | 'ESNext.Promise'
    | 'ESNext.String'
    | 'ESNext.Symbol'
    | 'DOM'
    | 'DOM.Iterable'
    | 'ScriptHost'
    | 'WebWorker'
    | 'WebWorker.ImportScripts'
  )[]
  strictNullChecks?: boolean
  maxNodeModuleJsDepth?: number
  importHelpers?: boolean
  importsNotUsedAsValues?: 'remove' | 'preserve' | 'error'
  alwaysStrict?: boolean
  strict?: boolean
  strictBindCallApply?: boolean
  downlevelIteration?: boolean
  checkJs?: boolean
  strictFunctionTypes?: boolean
  strictPropertyInitialization?: boolean
  esModuleInterop?: boolean
  allowUmdGlobalAccess?: boolean
  keyofStringsOnly?: boolean
  useDefineForClassFields?: boolean
  declarationMap?: boolean
  resolveJsonModule?: boolean
  assumeChangesOnlyAffectDirectDependencies?: boolean
  extendedDiagnostics?: boolean
  listFilesOnly?: boolean
  disableSourceOfProjectReferenceRedirect?: boolean
  disableSolutionSearching?: boolean
  [k: string]: unknown
}
