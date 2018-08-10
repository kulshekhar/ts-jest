import TsJestTransformer from '../src/ts-jest-transformer';
import jestConfigMock from './__helpers__/jest-config-mock';
import {
  transpiledTsSourceMock,
  filePathMock,
} from './__helpers__/sources-mock';

jest.mock(
  '../src/ts-program',
  () =>
    class TsProgramMock {
      transpileModule(_: string, source: string) {
        return source;
      }
    },
);

const path = filePathMock('path/to/file.ts');
const content = transpiledTsSourceMock();

describe('hoisting', () => {
  const transformer = new TsJestTransformer();
  it('should hoist jest.mock calls using babel', () => {
    const config = jestConfigMock({}, { babelJest: true });
    const result = transformer.process(
      content,
      path,
      config,
    ) as jest.TransformedSource;
    expect(result.code).toMatchSnapshot();
  });
});
