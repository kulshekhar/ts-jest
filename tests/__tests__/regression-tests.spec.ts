import { process } from '../../src/preprocessor';
import * as fs from 'fs';

const globalConfig = {
	cacheDirectory:
		'/tmp/cacheStuff',
	globals: {
		__TS_CONFIG__: {
		
		}
	}
};

const allowSyntheticDefaultImportsConfig = {
	cacheDirectory:
		'/tmp/cacheStuff',
	globals: {
		__TS_CONFIG__: {
			allowSyntheticDefaultImports: true,
			jsx: 'react',
		}
	}
};

const skipBabelConfig = {
	cacheDirectory:
		'/tmp/cacheStuff',
	globals: {
		__TS_CONFIG__: {
			allowSyntheticDefaultImports: true,
			jsx: 'react',
		},
		'ts-jest':
			{
				skipBabel: true,
			}
	}
};

describe('Process regession tests', () => {
	//These tests are to make that we only intentionally change the output of process.
	
	it('Should not change the output of process that compiles .ts files', () => {
		const src = fs.readFileSync('./tests/simple/Hello.ts', 'utf-8');
		const path = './tests/simple/Hello.ts';
		const outcome = process(src, path, globalConfig);
		
		expect(outcome).toMatchSnapshot();
	});
	
	it('Should not change the output of process that compiles .tsx files', () => {
		const src = fs.readFileSync('./tests/button/Button.tsx', 'utf-8');
		const path = './tests/simple/Button.tsx';
		const outcome = process(src, path, globalConfig);
		
		expect(outcome).toMatchSnapshot();
	});
	
	it('Should not change the output of process that compiles .ts files with syntheticdefaultimport', () => {
		const src = fs.readFileSync('./tests/synthetic-default/__tests__/module.test.ts', 'utf-8');
		const path = './tests/synthetic-default/__tests__/module.test.ts';
		const outcome = process(src, path, allowSyntheticDefaultImportsConfig);
		
		expect(outcome).toMatchSnapshot();
	});
	
	
	it('Should not change the output of process that compiles .tsx files with syntheticdefaultimport', () => {
		const src = fs.readFileSync('./tests/button/Button.tsx', 'utf-8');
		const path = './tests/button/Button.tsx';
		const outcome = process(src, path, allowSyntheticDefaultImportsConfig);
		
		expect(outcome).toMatchSnapshot();
	});
	
	it('Should not change the output of process that contains hoist calls', () => {
		//TODO
	});
	
	it('Should not change the output of a process that has skipBabel set to true', () => {
		const src = fs.readFileSync('./tests/synthetic-default/__tests__/module.test.ts', 'utf-8');
		const path = './tests/synthetic-default/__tests__/module.test.ts';
		const outcome = process(src, path, skipBabelConfig);
		
		expect(outcome).toMatchSnapshot();
	});
	
});