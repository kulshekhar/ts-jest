import * as crypto from 'crypto';
import * as tsc from 'typescript';
import { JestConfig, Path, TransformOptions } from './jest-types';
import { getPostProcessHook } from './postprocess';
import {
  cacheFile,
  getTSConfig,
  getTSJestConfig,
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
  const compilerOptions = getTSConfig(
    jestConfig.globals,
    transformOptions.instrument,
  );

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

  const tsTranspiled = tsc.transpileModule(src, {
    compilerOptions,
    fileName: filePath,
  });

  const tsJestConfig = getTSJestConfig(jestConfig.globals);

  const postHook = getPostProcessHook(
    compilerOptions,
    jestConfig,
    tsJestConfig,
  );

  const outputText = postHook(
    tsTranspiled.outputText,
    filePath,
    jestConfig,
    transformOptions,
  );

  const modified = injectSourcemapHook(
    filePath,
    tsTranspiled.outputText,
    outputText,
  );

  if (tsJestConfig.enableInternalCache === true) {
    // This config is undocumented.
    // This has been made configurable for now to ensure that
    // if this breaks something for existing users, there's a quick fix
    // in place.
    // If this doesn't cause a problem, this if block will be removed
    // in a future version
    cacheFile(jestConfig, filePath, modified);
  }

  return modified;
}

export function getCacheKey(
  fileData: string,
  filePath: Path,
  jestConfigStr: string,
  transformOptions: TransformOptions = { instrument: false },
): string {
  const jestConfig: JestConfig = JSON.parse(jestConfigStr);

  const tsConfig = getTSConfig(jestConfig.globals, transformOptions.instrument);

  return crypto
    .createHash('md5')
    .update(JSON.stringify(tsConfig), 'utf8')
    .update(JSON.stringify(transformOptions), 'utf8')
    .update(fileData + filePath + jestConfigStr, 'utf8')
    .digest('hex');
}
