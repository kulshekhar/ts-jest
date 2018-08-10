import TsProgram from '../src/ts-program';
import { resolve } from 'path';
import { tsSourceMock, filePathMock } from './__helpers__/sources-mock';

const path = filePathMock('path/to/file.ts');
const content = tsSourceMock();

describe('hoisting', () => {
  describe('without babel', () => {
    const prog = new TsProgram(resolve(__dirname, '..'), {
      babelJest: false,
      inputOptions: {},
      diagnostics: [],
    });

    it('should hoist jest.mock() calls', () => {
      const result = prog.transpileModule(path, content, undefined, {
        inlineSourceMap: false,
      });
      expect(result).toMatchSnapshot();
    });
  });

  describe('with babel', () => {
    const prog = new TsProgram(resolve(__dirname, '..'), {
      babelJest: true,
      inputOptions: {},
      diagnostics: [],
    });

    it('should not hoist jest.mock() calls', () => {
      const result = prog.transpileModule(path, content, undefined, {
        inlineSourceMap: false,
      });
      expect(result).toMatchSnapshot();
    });
  });
});
