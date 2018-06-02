import { TransformOptions as BabelTransformOpts } from 'babel-core';

export interface TransformOptions {
  instrument: boolean;
}

export type Path = string;

export type Glob = string;

export interface ConfigGlobals {
  [key: string]: any;
}

export interface HasteConfig {
  defaultPlatform?: string | null;
  hasteImplModulePath?: string;
  platforms?: string[];
  providesModuleNodeModules: string[];
}

export interface BabelTransformOptions extends BabelTransformOpts {
  cacheDirectory?: string;
}

export type PostProcessHook = (
  codeSourcemapPair: CodeSourceMapPair,
  filePath: string,
  config: JestConfig,
  transformOptions: TransformOptions,
) => CodeSourceMapPair;

export type JestConfig = Partial<FullJestProjectConfig>;

export interface FullJestProjectConfig {
  automock: boolean;
  browser: boolean;
  cache: boolean;
  cacheDirectory: Path;
  clearMocks: boolean;
  coveragePathIgnorePatterns: string[];
  cwd: Path;
  detectLeaks: boolean;
  detectOpenHandles: boolean;
  displayName: string | null;
  errorOnDeprecated: boolean;
  filter: Path | null;
  forceCoverageMatch: Glob[];
  globals: ConfigGlobals;
  haste: HasteConfig;
  moduleDirectories: string[];
  moduleFileExtensions: string[];
  moduleLoader: Path;
  moduleNameMapper: Array<[string, string]>;
  modulePathIgnorePatterns: string[];
  modulePaths: string[];
  name: string;
  resetMocks: boolean;
  resetModules: boolean;
  resolver: Path | null;
  restoreMocks: boolean;
  rootDir: Path;
  roots: Path[];
  runner: string;
  setupFiles: Path[];
  setupTestFrameworkScriptFile: Path | null;
  skipFilter: boolean;
  skipNodeResolution: boolean;
  snapshotSerializers: Path[];
  testEnvironment: string;
  testEnvironmentOptions: object;
  testLocationInResults: boolean;
  testMatch: Glob[];
  testPathIgnorePatterns: string[];
  testRegex: string;
  testRunner: string;
  testURL: string;
  timers: 'real' | 'fake';
  transform: Array<[string, Path]>;
  transformIgnorePatterns: Glob[];
  watchPathIgnorePatterns: string[];
  unmockedModulePathPatterns: string[] | null;
}

export interface TsJestConfig {
  skipBabel?: boolean;
  useBabelrc?: boolean;
  babelConfig?: BabelTransformOpts;
  tsConfigFile?: string;
  enableInternalCache?: boolean;
  enableTsDiagnostics?: boolean;
  disableSourceMapSupport?: boolean;
  ignoreCoverageForDecorators?: boolean;
  ignoreCoverageForAllDecorators?: boolean;
  useExperimentalLanguageServer?: boolean;
}

export interface JestConfigNormalize {
  hasDeprecationWarnings: boolean;
  options: FullJestProjectConfig;
}

export interface CodeSourceMapPair {
  code: string;
  map: string;
}
