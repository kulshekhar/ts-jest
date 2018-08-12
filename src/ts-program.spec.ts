import TsProgram from './ts-program';
import { resolve } from 'path';
import * as fakers from './__helpers__/fakers';

const path = fakers.filePath('path/to/file.ts');
const content = fakers.typescriptSource();

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
