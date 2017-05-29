import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as tsc from 'typescript';
import { getTSConfig, getTSJestConfig } from './utils';
import * as nodepath from 'path';
import { TransformOptions, Path, JestConfig } from "./jest-types";
import { createTransformer } from './postprocess';

const babelJest = createTransformer({
        presets: [],
        plugins: ['transform-es2015-modules-commonjs']
    });
let tsJestConfig;

export function process(
    src: string,
    path: Path,
    config: JestConfig,
    transformOptions: TransformOptions = { instrument: false }) {

    if (tsJestConfig === undefined) {
        tsJestConfig = getTSJestConfig(config.globals);
    }
    const root = require('pkg-dir').sync();
    // transformOptions.instrument is a proxy for collectCoverage
    // https://github.com/kulshekhar/ts-jest/issues/201#issuecomment-300572902
    const compilerOptions = getTSConfig(config.globals, transformOptions.instrument);

    const isTsFile = path.endsWith('.ts') || path.endsWith('.tsx');
    const isJsFile = path.endsWith('.js') || path.endsWith('.jsx');
    const isHtmlFile = path.endsWith('.html');

    if (isHtmlFile && config.globals.__TRANSFORM_HTML__) {
        src = 'module.exports=`' + src + '`;';
    }

    const processFile = compilerOptions.allowJs === true
        ? isTsFile || isJsFile
        : isTsFile;

    if (processFile) {
        const tsTranspiled = tsc.transpileModule(
            src,
            {
                compilerOptions: compilerOptions,
                fileName: path
            }
        );

        const outputText =
            compilerOptions.allowSyntheticDefaultImports && !tsJestConfig.skipBabel
                ? babelJest.process(
                    tsTranspiled.outputText,
                    path + '.js', // babel-jest only likes .js files ¯\_(ツ)_/¯
                    config,
                    transformOptions
                )
                : tsTranspiled.outputText;

        // strip root part from path
        // this results in a shorter filename which will also make the encoded base64 filename for the cache shorter
        // long file names could be problematic in some OS
        // see https://github.com/kulshekhar/ts-jest/issues/158
        path = path.startsWith(root) ? path.substr(root.length) : path;

        //store transpiled code contains source map into cache, except test cases
        if (!config.testRegex || !path.match(config.testRegex)) {
            fs.outputFileSync(nodepath.join(config.cacheDirectory, '/ts-jest/', new Buffer(path).toString('base64')), outputText);
        }

        const start = outputText.length > 12 ? outputText.substr(1, 10) : '';

        const modified = start === 'use strict'
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
    options: TransformOptions = { instrument: false }): string {

    const jestConfig: JestConfig = JSON.parse(configStr);
    const tsConfig = getTSConfig(jestConfig.globals, options.instrument);

    return crypto.createHash('md5')
        .update(JSON.stringify(tsConfig), 'utf8')
        .update(fileData + filePath + configStr, 'utf8')
        .digest('hex');
}
