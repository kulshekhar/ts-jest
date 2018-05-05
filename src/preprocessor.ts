import * as crypto from 'crypto';
import * as tsc from 'typescript';
import { JestConfig, Path, TransformOptions } from './jest-types';
import { flushLogs, logOnce } from './logger';
import { getPostProcessHook } from './postprocess';
import {
  getTSConfig,
  getTSJestConfig,
  runTsDiagnostics,
  injectSourcemapHook,
} from './utils';

export function process(
  src: string,
  filePath: Path,
  jestConfig: JestConfig,
  transformOptions: TransformOptions = { instrument: false },
) {
  // transformOptions.instrument is a proxy for collectCoverage
  // https://github.com/kulshekhar/ts-jest/issues/201#issuecomment-300572902
  const compilerOptions = getTSConfig(jestConfig.globals, jestConfig.rootDir);

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

  if (tsJestConfig.enableTsDiagnostics) {
    runTsDiagnostics(filePath, compilerOptions);
  }

  const tsTranspiled = tsc.transpileModule(src, {
    compilerOptions,
    fileName: filePath,
  });

  let tsTranspiledText = tsTranspiled.outputText;
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

  const postHook = getPostProcessHook(
    compilerOptions,
    jestConfig,
    tsJestConfig,
  );

  const outputText = postHook(
    tsTranspiledText,
    filePath,
    jestConfig,
    transformOptions,
  );

  const modified =
    tsJestConfig.disableSourceMapSupport === true
      ? outputText
      : injectSourcemapHook(filePath, tsTranspiledText, outputText);

  flushLogs();

  return modified;
}

/**
 * This is the function Jest uses to check if it has the file already in cache
 */
export function getCacheKey(
  fileData: string,
  filePath: Path,
  jestConfigStr: string,
  transformOptions: TransformOptions = { instrument: false },
): string {
  const jestConfig: JestConfig = JSON.parse(jestConfigStr);

  const tsConfig = getTSConfig(jestConfig.globals, jestConfig.rootDir);

  return crypto
    .createHash('md5')
    .update(JSON.stringify(tsConfig), 'utf8')
    .update(JSON.stringify(transformOptions), 'utf8')
    .update(fileData + filePath + jestConfigStr, 'utf8')
    .digest('hex');
}
