import { TsJestConfig } from '../../dist/types';

const { resolve } = require.requireActual('path');

function createJestConfig(
  testModulePath: string,
  tsJestOptions: TsJestConfig | null = null,
  jestOptions: jest.InitialOptions = {},
): jest.ProjectConfig {
  const rootDir = resolve(__dirname, '..', testModulePath);
  let options = { ...jestOptions };
  if (tsJestOptions)
    options.globals = { ...options.globals, 'ts-jest': tsJestOptions };
  return { rootDir, ...options } as any;
}
require('fs').read;
const jestConfig = Object.assign(createJestConfig, {
  babelConfig: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('babel-config', t, j),
  babelConfigInvalid: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('babel-config-invalid', t, j),
  babelConfigMergeIgnoreBabelrc: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => createJestConfig('babel-config-merge-ignore-babelrc', t, j),
  babelConfigMergeWithBabelrc: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => createJestConfig('babel-config-merge-with-babelrc', t, j),
  button: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('button', t, j),
  dynamicImports: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('dynamic-imports', t, j),
  hoistErrors: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('hoist-errors', t, j),
  hoistTest: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('hoist-test', t, j),
  importsTest: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('imports-test', t, j),
  jestProjects: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('jest-projects', t, j),
  jestProjectsWithWorkspace: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => createJestConfig('jest-projects-with-workspace', t, j),
  jestconfigTest: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('jestconfig-test', t, j),
  metadataEmit: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('metadata-emit', t, j),
  noJsonModuleFileExt: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('no-json-module-file-ext', t, j),
  noSourcemaps: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('no-sourcemaps', t, j),
  noSyntheticDefault: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('no-synthetic-default', t, j),
  simple: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('simple', t, j),
  simpleAsync: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('simple-async', t, j),
  simpleLongPath: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('simple-long-path', t, j),
  skipBabelrc: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('skip-babelrc', t, j),
  syntheticDefault: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('synthetic-default', t, j),
  tsDiagnostics: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('ts-diagnostics', t, j),
  tsJestModuleInterface: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('ts-jest-module-interface', t, j),
  tsconfigTest: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('tsconfig-test', t, j),
  useBabelrc: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('use-babelrc', t, j),
  useConfigFromNodeModules: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => createJestConfig('use-config-from-node-modules', t, j),
  useStrict: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('use-strict', t, j),
  utils: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('utils', t, j),
  watchTest: (t?: TsJestConfig | null, j?: jest.InitialOptions) =>
    createJestConfig('watch-test', t, j),
});

interface TestJestConfigHelpers {
  (
    testModulePath: string,
    tsJestOptions?: TsJestConfig | null,
    jestOptions?: jest.InitialOptions,
  ): jest.ProjectConfig;
  babelConfig: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  babelConfigInvalid: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  babelConfigMergeIgnoreBabelrc: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  babelConfigMergeWithBabelrc: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  button: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  dynamicImports: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  hoistErrors: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  hoistTest: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  importsTest: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  jestProjects: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  jestProjectsWithWorkspace: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  jestconfigTest: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  metadataEmit: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  noJsonModuleFileExt: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  noSourcemaps: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  noSyntheticDefault: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  simple: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  simpleAsync: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  simpleLongPath: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  skipBabelrc: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  syntheticDefault: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  tsDiagnostics: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  tsJestModuleInterface: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  tsconfigTest: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  useBabelrc: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  useConfigFromNodeModules: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  useStrict: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  utils: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
  watchTest: (
    t?: TsJestConfig | null,
    j?: jest.InitialOptions,
  ) => jest.ProjectConfig;
}

export default jestConfig as TestJestConfigHelpers;
