import { resolve } from 'path';

export function filePathMock(relPath: string): string {
  return resolve(__dirname, '..', '..', relPath);
}

export function transpiledTsSourceMock() {
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
`;
}

export function tsSourceMock() {
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
`;
}
