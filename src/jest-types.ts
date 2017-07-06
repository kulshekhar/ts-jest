import { TransformOptions as BabelTransformOpts } from 'babel-core';
export interface TransformOptions {
  instrument: boolean;
}

export type Path = string;

export type Glob = string;

export type ConfigGlobals = { [key: string]: any};

export type HasteConfig = {
  defaultPlatform?: string | null;
  hasteImplModulePath?: string;
  platforms?: Array<string>;
  providesModuleNodeModules: Array<string>;
};


export interface BabelTransformOptions extends BabelTransformOpts{
  cacheDirectory?: string;
};

export interface PostProcessHook {
  (src: string, filename: string, config: JestConfig, transformOptions: TransformOptions): string;
};

export type JestConfig = Partial<FullJestConfig>;

export type FullJestConfig = {
  automock: boolean;
  browser: boolean;
  cache: boolean;
  cacheDirectory: Path;
  clearMocks: boolean;
  coveragePathIgnorePatterns: Array<string>;
  globals: ConfigGlobals;
  haste: HasteConfig;
  moduleDirectories: Array<string>;
  moduleFileExtensions: Array<string>;
  moduleLoader: Path;
  moduleNameMapper: Array<[string, string]>;
  modulePathIgnorePatterns: Array<string>;
  modulePaths: Array<string>;
  name: string;
  resetMocks: boolean;
  resetModules: boolean;
  resolver: Path | null;
  rootDir: Path;
  roots: Array<Path>;
  setupFiles: Array<Path>;
  setupTestFrameworkScriptFile: Path;
  snapshotSerializers: Array<Path>;
  testEnvironment: string;
  testMatch: Array<Glob>;
  testPathIgnorePatterns: Array<string>;
  testRegex: string;
  testRunner: string;
  testURL: string;
  timers: 'real' | 'fake';
  transform: Array<[string, Path]>;
  transformIgnorePatterns: Array<Glob>;
  unmockedModulePathPatterns: Array<string> | null;
};

export interface TsJestConfig {
	skipBabel?: boolean;
	useBabelrc?: boolean;
};
                          
