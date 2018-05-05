import * as crypto from 'crypto';
import { JestConfig, Path, TransformOptions } from './jest-types';
import { flushLogs, logOnce } from './logger';
import { getPostProcessHook, postProcessCode } from './postprocess';
import {
  cacheFile,
  getTSConfig,
  getTSJestConfig,
  runTsDiagnostics,
  injectSourcemapHook,
} from './utils';
import { cwd } from 'process';
import * as fs from 'fs';
import { outputFile } from 'fs-extra';
import { transpileTypescript } from './transpiler';
import * as ts from 'typescript';
import { file } from 'babel-types';

// tslint:disable

export function process(
  src: string,
  filePath: Path,
  jestConfig: JestConfig,
  transformOptions: TransformOptions = { instrument: false },
) {
  // transformOptions.instrument is a proxy for collectCoverage
  // https://github.com/kulshekhar/ts-jest/issues/201#issuecomment-300572902
  const compilerOptions = getTSConfig(
    jestConfig.globals,
    jestConfig.rootDir,
    transformOptions.instrument,
  );

  logOnce('final compilerOptions:', compilerOptions);

  const isTsFile = /\.tsx?$/.test(filePath);
  const isJsFile = /\.jsx?$/.test(filePath);
  const isHtmlFile = /\.html$/.test(filePath);

  // This is to support angular 2. See https://github.com/kulshekhar/ts-jest/pull/145
  if (isHtmlFile && jestConfig.globals.__TRANSFORM_HTML__) {
    src = 'module.exports=`' + src + '`;';
  }

  const processFile =
    compilerOptions.allowJs === true ? isTsFile || isJsFile : isTsFile;

  if (!processFile) {
    return src;
  }

  const tsJestConfig = getTSJestConfig(jestConfig.globals);
  logOnce('tsJestConfig: ', tsJestConfig);

  // We can potentially do this faster by using the language service.
  // See https://github.com/TypeStrong/ts-node/blob/master/src/index.ts#L268
  if (tsJestConfig.enableTsDiagnostics) {
    runTsDiagnostics(filePath, compilerOptions);
  }

  let tsTranspiledText = transpileTypescript(
    filePath,
    src,
    compilerOptions,
    tsJestConfig,
  );

  if (tsJestConfig.ignoreCoverageForAllDecorators === true) {
    tsTranspiledText = tsTranspiledText.replace(
      /__decorate/g,
      '/* istanbul ignore next */__decorate',
    );
  }
  if (tsJestConfig.ignoreCoverageForDecorators === true) {
    tsTranspiledText = tsTranspiledText.replace(
      /(__decorate\(\[\r?\n[^\n\r]*)\/\*\s*istanbul\s*ignore\s*decorator(.*)\*\//g,
      '/* istanbul ignore next$2*/$1',
    );
  }

  const outputText = postProcessCode(
    compilerOptions,
    jestConfig,
    tsJestConfig,
    transformOptions,
    tsTranspiledText,
    filePath,
  );

  const modified =
    tsJestConfig.disableSourceMapSupport === true
      ? outputText
      : injectSourcemapHook(filePath, tsTranspiledText, outputText);

  flushLogs();

  return modified;
}

export function getCacheKey(
  fileData: string,
  filePath: Path,
  jestConfigStr: string,
  transformOptions: TransformOptions = { instrument: false },
): string {
  const jestConfig: JestConfig = JSON.parse(jestConfigStr);

  const tsConfig = getTSConfig(
    jestConfig.globals,
    jestConfig.rootDir,
    transformOptions.instrument,
  );

  return crypto
    .createHash('md5')
    .update(JSON.stringify(tsConfig), 'utf8')
    .update(JSON.stringify(transformOptions), 'utf8')
    .update(fileData + filePath + jestConfigStr, 'utf8')
    .digest('hex');
}
