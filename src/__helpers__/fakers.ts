import { resolve } from 'path'

import { BabelConfig, TsJestConfig, TsJestGlobalOptions } from '../types'
import { ImportReasons } from '../util/messages'

export function filePath(relPath: string): string {
  return resolve(__dirname, '..', '..', relPath)
}

export const rootDir = filePath('')

export function transpiledTsSource() {
  return `
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var upper_1 = __importDefault(require("./upper"));
var lower_1 = __importDefault(require("./lower"));
jest.mock('./upper', function () { return function (s) { return s.toUpperCase(); }; });
describe('hello', function () {
    test('my test', function () {
        expect(upper_1.default('hello')).toBe('HELLO');
        expect(lower_1.default('HELLO')).toBe('hello');
        jest.mock('./lower', function () { return function (s) { return s.toLowerCase(); }; });
    });
});
`
}

export function htmlSource() {
  return `
<div>
  <span>some text with \`backtick\`</span>
</div>
`
}

export function typescriptSource() {
  return `
import upper from './upper';
import lower from './lower';

jest.mock('./upper', () => (s) => s.toUpperCase());

describe('hello', () => {
  test('my test', () => {
    expect(upper('hello')).toBe('HELLO');
    expect(lower('HELLO')).toBe('hello');
    jest.mock('./lower', () => (s) => s.toLowerCase());
  });
});
`
}

export function tsJestConfig(options?: Partial<TsJestConfig>): TsJestConfig {
  return {
    isolatedModules: false,
    compiler: 'typescript',
    transformers: [],
    babelConfig: undefined,
    tsConfig: undefined,
    stringifyContentPathRegex: undefined,
    diagnostics: { ignoreCodes: [], pretty: false },
    ...options,
  }
}

export function jestConfig<T extends jest.ProjectConfig>(
  options?: Partial<jest.InitialOptions | jest.ProjectConfig>,
  tsJestOptions?: TsJestGlobalOptions,
): T {
  const res = {
    globals: {},
    ...options,
  } as any
  if (tsJestOptions) {
    res.globals['ts-jest'] = tsJestOptions
  }
  return res
}

export function babelConfig<T extends BabelConfig>(options?: BabelConfig): T {
  return {
    ...options,
    presets: [...(options && options.presets)],
    plugins: [...(options && options.plugins)],
  } as any
}

export function importReason(text = '[[BECAUSE]]'): ImportReasons {
  return text as any
}
