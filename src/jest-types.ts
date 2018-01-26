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
  src: string,
  filename: string,
  config: JestConfig,
  transformOptions: TransformOptions,
) => string;

export type JestConfig = Partial<FullJestConfig>;

export interface FullJestConfig {
  automock: boolean;
  browser: boolean;
  cache: boolean;
  cacheDirectory: Path;
  clearMocks: boolean;
  coveragePathIgnorePatterns: string[];
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
  rootDir: Path;
  roots: Path[];
  setupFiles: Path[];
  setupTestFrameworkScriptFile: Path;
  snapshotSerializers: Path[];
  testEnvironment: string;
  testMatch: Glob[];
  testPathIgnorePatterns: string[];
  testRegex: string;
  testRunner: string;
  testURL: string;
  timers: 'real' | 'fake';
  transform: Array<[string, Path]>;
  transformIgnorePatterns: Glob[];
  unmockedModulePathPatterns: string[] | null;
}

export interface TsJestConfig {
  skipBabel?: boolean;
  useBabelrc?: boolean;
  babelConfig?: BabelTransformOpts;
  tsConfigFile?: string;
  enableInternalCache?: boolean;
}
