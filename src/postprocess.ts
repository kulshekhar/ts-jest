/**
 * Postprocess step. Stolen from babel-jest: https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.js
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as jestPreset from 'babel-preset-jest';
import { JestConfig, PostProcessorOptions, TransformOptions } from './jest-types';
import * as babel from 'babel-core';

const BABELRC_FILENAME = '.babelrc';
const BABELRC_JS_FILENAME = '.babelrc.js';
const BABEL_CONFIG_KEY = 'babel';
const PACKAGE_JSON = 'package.json';
//const THIS_FILE = fs.readFileSync(__filename);

let babel;

export const createTransformer = (options: PostProcessorOptions) => {
	/*const getBabelRC = filename => {
		const paths = [];
		let directory = filename;
		while (directory !== (directory = path.dirname(directory))) {
			if (cache[directory]) {
				break;
			}
			
			paths.push(directory);
			const configFilePath = path.join(directory, BABELRC_FILENAME);
			if (fs.existsSync(configFilePath)) {
				cache[directory] = fs.readFileSync(configFilePath, 'utf8');
				break;
			}
			const configJsFilePath = path.join(directory, BABELRC_JS_FILENAME);
			if (fs.existsSync(configJsFilePath)) {
				// $FlowFixMe
				cache[directory] = JSON.stringify(require(configJsFilePath));
				break;
			}
			const packageJsonFilePath = path.join(directory, PACKAGE_JSON);
			if (fs.existsSync(packageJsonFilePath)) {
				// $FlowFixMe
				const packageJsonFileContents = require(packageJsonFilePath);
				if (packageJsonFileContents[BABEL_CONFIG_KEY]) {
					cache[directory] = JSON.stringify(
						packageJsonFileContents[BABEL_CONFIG_KEY],
					);
					break;
				}
			}
		}
		paths.forEach(directoryPath => (cache[directoryPath] = cache[directory]));
		return cache[directory] || '';
	};*/
	options = Object.assign({}, options, {
		plugins: (options && options.plugins) || [],
		presets: ((options && options.presets) || []).concat([jestPreset]),
		retainLines: true,
	});
	delete options.cacheDirectory;
	delete options.filename;
	return {
		canInstrument: true,
		/*getCacheKey(fileData: string,
		            filename: Path,
		            configString: string,
		            {instrument}: TransformOptions,): string {
			return crypto
				.createHash('md5')
				.update(THIS_FILE)
				.update('\0', 'utf8')
				.update(fileData)
				.update('\0', 'utf8')
				.update(configString)
				.update('\0', 'utf8')
				.update(getBabelRC(filename))
				.update('\0', 'utf8')
				.update(instrument ? 'instrument' : '')
				.digest('hex');
		},*/
		process(src: string,
		        filename : string,
		        config : JestConfig,
		        transformOptions : TransformOptions): string {
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
		},
	};
};