import TsProgram from '../src/ts-program';
import { resolve } from 'path';

const path = '/dummy/path/to/file.ts';
const content = `
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

describe('hoisting', () => {
  const prog = new TsProgram(resolve(__dirname, '..'), {
    useBabelJest: false,
    inputOptions: {},
    diagnostics: [],
  });

  it('should hoist jest.mock()', () => {
    const result = prog.transpileModule(path, content, undefined, {
      inlineSourceMap: false,
    });
    expect(result).toMatchSnapshot();
  });
});
