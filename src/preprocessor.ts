import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as nodepath from 'path';
import * as tsc from 'typescript';
import { JestConfig, Path, TransformOptions } from './jest-types';
import { getPostProcessHook } from './postprocess';
import { getTSConfig, getTSJestConfig } from './utils';

export function process(
  src: string,
  path: Path,
  config: JestConfig,
  transformOptions: TransformOptions = { instrument: false },
) {
  // transformOptions.instrument is a proxy for collectCoverage
  // https://github.com/kulshekhar/ts-jest/issues/201#issuecomment-300572902
  const compilerOptions = getTSConfig(
    config.globals,
    transformOptions.instrument,
  );
  const tsJestConfig = getTSJestConfig(config.globals);

  const isTsFile = path.endsWith('.ts') || path.endsWith('.tsx');
  const isJsFile = path.endsWith('.js') || path.endsWith('.jsx');
  const isHtmlFile = path.endsWith('.html');

  const postHook = getPostProcessHook(compilerOptions, config, tsJestConfig);

  if (isHtmlFile && config.globals.__TRANSFORM_HTML__) {
    src = 'module.exports=`' + src + '`;';
  }

  const processFile =
    compilerOptions.allowJs === true ? isTsFile || isJsFile : isTsFile;

  if (processFile) {
    const tsTranspiled = tsc.transpileModule(src, {
      compilerOptions,
      fileName: path,
    });

    const outputText = postHook(
      tsTranspiled.outputText,
      path,
      config,
      transformOptions,
    );

    // store transpiled code contains source map into cache, except test cases
    if (!config.testRegex || !path.match(config.testRegex)) {
      const outputFilePath = nodepath.join(
        config.cacheDirectory,
        '/ts-jest/',
        crypto
          .createHash('md5')
          .update(path)
          .digest('hex'),
      );

      fs.outputFileSync(outputFilePath, outputText);
    }

    const start = outputText.length > 12 ? outputText.substr(1, 10) : '';

    const modified =
      start === 'use strict'
        ? `'use strict';require('ts-jest').install();${outputText}`
        : `require('ts-jest').install();${outputText}`;

    return modified;
  }

  return src;
}

export function getCacheKey(
  fileData: string,
  filePath: Path,
  configStr: string,
  options: TransformOptions = { instrument: false },
): string {
  const jestConfig: JestConfig = JSON.parse(configStr);
  const tsConfig = getTSConfig(jestConfig.globals, options.instrument);

  return crypto
    .createHash('md5')
    .update(JSON.stringify(tsConfig), 'utf8')
    .update(JSON.stringify(options), 'utf8')
    .update(fileData + filePath + configStr, 'utf8')
    .digest('hex');
}
