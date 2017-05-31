/**
 * Postprocess step. Based on babel-jest: https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js
 * https://github.com/facebook/jest/blob/9b157c3a7c325c3971b2aabbe4c8ab4ce0b0c56d/packages/babel-jest/src/index.js
 */
import * as jestPreset from 'babel-preset-jest';
import {JestConfig, PostProcessHook, PostProcessorOptions, TransformOptions} from './jest-types';
import * as babel from 'babel-core';
import {CompilerOptions} from 'typescript/lib/typescript';

function createBabelTransformer(options: PostProcessorOptions) {
    options = {
        ...options,
        plugins: (options && options.plugins) || [],
        presets: ((options && options.presets) || []).concat([jestPreset]),
        retainLines: true,
    };
    delete options.cacheDirectory;
    delete options.filename;

    return (src: string,
            filename: string,
            config: JestConfig,
            transformOptions: TransformOptions): string => {
        const theseOptions = Object.assign({filename}, options);
        if (transformOptions && transformOptions.instrument) {
            theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
            // Copied from jest-runtime transform.js
            theseOptions.plugins = theseOptions.plugins.concat([
                [
                    require('babel-plugin-istanbul').default,
                    {
                        // files outside `cwd` will not be instrumented
                        cwd: config.rootDir,
                        exclude: [],
                    },
                ],
            ]);
        }
        return babel.transform(src, theseOptions).code;
    };
}

export const getPostProcessHook = (tsCompilerOptions: CompilerOptions, jestConfig: JestConfig, tsJestConfig: any): PostProcessHook => {
    if (tsJestConfig.skipBabel) {
        return (src) => src; //Identity function
    }

    const plugins = [];
    //If we're not skipping babel
    if (tsCompilerOptions.allowSyntheticDefaultImports) {
        plugins.push('transform-es2015-modules-commonjs');
    }


    return createBabelTransformer({
        presets: [],
        plugins: plugins,
    });
};
