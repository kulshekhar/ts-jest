import { TSCONFIG_FILENAME } from './constants';
import {
  CompilerOptions,
  readConfigFile,
  sys,
  parseJsonConfigFileContent,
  ModuleKind,
  JsxEmit,
} from 'typescript';
import { resolve, sep, dirname } from 'path';
import { existsSync } from 'fs';
import formatTsDiagnostics from './format-diagnostics';
import closestFileData from 'closest-file-data';
import { memoize } from 'lodash';
import { logOnce } from './logger';
import getTSJestConfig from './get-ts-jest-config';

const getTSConfig = memoize(getTSConfig_local, jestConfig => {
  // check cache before resolving configuration
  // NB: We use JSON.stringify() to create a consistent, unique signature. Although it lacks a uniform
  //     shape, this is simpler and faster than using the crypto package to generate a hash signature.
  return JSON.stringify({ ...jestConfig, name: null, cacheDirectory: null });
});
export default getTSConfig;

// Non-memoized version of TSConfig
function getTSConfig_local(jestConfig: jest.ProjectConfig): CompilerOptions {
  const configMeta = findTSConfigPath(jestConfig);
  if (!configMeta) {
    throw new ReferenceError(
      `[ts-jest] Unable to find TS configuration file given current configuration`,
    );
  }
  const { path: configPath } = configMeta;
  logOnce(`Reading tsconfig file from path ${configPath}`);

  const config = readCompilerOptions(configPath);
  logOnce('Original typescript config before modifications: ', { ...config });

  // tsc should not emit declaration map when used for tests
  // disable some options that might break jest
  config.declaration = false;
  config.declarationMap = false;
  config.emitDeclarationOnly = false;

  // ts-jest will map lines numbers properly if inlineSourceMap and
  // inlineSources are set to true. The sourceMap configuration
  // is used to send the sourcemap back to Jest
  config.inlineSourceMap = false;
  config.sourceMap = true;
  config.inlineSources = true;

  // the coverage report is broken if `.outDir` is set
  // see https://github.com/kulshekhar/ts-jest/issues/201
  // `.outDir` is removed even for test files as it affects with breakpoints
  // see https://github.com/kulshekhar/ts-jest/issues/309
  delete config.outDir;
  delete config.outFile;

  if (!configMeta.isUserDefined) {
    // hardcode module to 'commonjs' in case the config is being loaded
    // from the default tsconfig file. This is to ensure that coverage
    // works well. If there's a need to override, it can be done using
    // a custom tsconfig for testing
    config.module = ModuleKind.CommonJS;
  }

  config.module = config.module || ModuleKind.CommonJS;
  config.jsx = config.jsx || JsxEmit.React;

  return config;
}

function readCompilerOptions(configPath: string): CompilerOptions {
  // at this point the configPath is resolved
  const { config, error } = readConfigFile(configPath, sys.readFile);
  if (error) {
    throw error;
  }

  const { errors, options } = parseJsonConfigFileContent(
    config,
    sys,
    // paths in a tsconfig are relative to that file's path
    dirname(configPath),
  );

  if (errors.length > 0) {
    const formattedErrors = formatTsDiagnostics(errors);
    throw new Error(
      `Some errors occurred while attempting to read from ${configPath}: ${formattedErrors}`,
    );
  }

  return options;
}

// we don't need any data, just its full path
const tsConfigReader = { basename: TSCONFIG_FILENAME, read: () => 0 };

function findTSConfigPath(
  jestConfig: jest.ProjectConfig,
): { isUserDefined?: boolean; path: string } | void {
  let tsConfigFile = getTSJestConfig(jestConfig).tsConfigFile;
  if (tsConfigFile) {
    const givenConfigFile = tsConfigFile;
    tsConfigFile = tsConfigFile.replace(
      '<rootDir>',
      `${jestConfig.rootDir}${sep}`,
    );
    // ensure the path is resolved
    if (!tsConfigFile.startsWith('/')) {
      tsConfigFile = resolve(jestConfig.rootDir, tsConfigFile);
    } else {
      tsConfigFile = resolve(tsConfigFile);
    }
    if (!existsSync(tsConfigFile)) {
      throw new Error(
        [
          `Unable to find tsconfig file given "${givenConfigFile}". If you gave a relative path,`,
          `it'll be relative to the resolved "rootDir".\nTo avoid issues, use <rootDir> followed`,
          `by a relative path to it in "tsConfigFile" config key.`,
        ].join(' '),
      );
    }
    return { path: tsConfigFile, isUserDefined: true };
  }

  // try to find the config file starting from the root dir as defined in (or resolved by) jest config
  return closestFileData(jestConfig.rootDir, tsConfigReader);
}
