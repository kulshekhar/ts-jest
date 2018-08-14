import TsJestTransformerOriginal from './ts-jest-transformer';
import * as fakers from './__helpers__/fakers';
import * as closesPkgJson from './utils/closest-package-json';
import * as TsJestProgram from './ts-program';

jest.mock('./ts-program');
jest.mock('./utils/closest-package-json');
jest.mock('./utils/backports');

const mocks = {
  babelJestCacheKey: undefined as any,
  set packageJson(val: any) {
    (closesPkgJson as any).__default = val;
  },
  set tsConfig(val: any) {
    (TsJestProgram as any).__tsConfig = val;
  },
  reset() {
    this.babelJestCacheKey = 'babel-jest-cache-key';
    this.packageJson = { name: 'mock' };
    this.tsConfig = {};
  },
};
afterEach(() => {
  mocks.reset();
});

class TsJestTransformer extends TsJestTransformerOriginal {
  babelJestFor(jestCfg: jest.ProjectConfig) {
    const bj = super.babelJestFor(jestCfg);
    if (bj && !(bj.getCacheKey as any).mock) {
      jest
        .spyOn(bj, 'getCacheKey')
        .mockImplementation(() => mocks.babelJestCacheKey);
    }
    return bj;
  }
}

describe('process', () => {
  describe('hoisting', () => {
    const transformer = new TsJestTransformer();
    it('should hoist jest.mock calls using babel', () => {
      const config = fakers.jestConfig({}, { babelJest: true });
      const result = transformer.process(
        fakers.transpiledTsSource(),
        fakers.filePath('path/to/file.ts'),
        config,
      ) as jest.TransformedSource;
      expect(result.code).toMatchSnapshot();
    });
  }); // hoisting

  describe('stringifyContentPathRegex', () => {
    const transformer = new TsJestTransformer();
    it('should create a module with stringified content as export', () => {
      const config = fakers.jestConfig(
        {},
        { stringifyContentPathRegex: '\\.html$' },
      );
      const source = fakers.htmlSource();
      const result = transformer.process(
        source,
        fakers.filePath('path/to/file.html'),
        config,
      ) as string;
      expect(result).toMatchSnapshot();
      const importer = Function(
        `const exports = {}, module = {exports:exports};${result};return module.exports;`,
      );
      expect(importer).not.toThrow();
      expect(importer()).toEqual(source);
    });
  }); // stringifyContentPathRegex
}); // process

describe('getCacheKey', () => {
  const fakeSource = fakers.typescriptSource();
  const fakeFilePath = fakers.filePath('file.ts');
  const fakeJestConfig = JSON.stringify(
    fakers.jestConfig({}, { babelJest: true }),
  );

  const call: typeof TsJestTransformer['prototype']['getCacheKey'] = (
    // tslint:disable-next-line:trailing-comma
    ...args
  ) => {
    const tr = new TsJestTransformer();
    return tr.getCacheKey(...args);
  };
  const defaultCall = () => call(fakeSource, fakeFilePath, fakeJestConfig);

  it('should be a 28 chars string, different for each case', () => {
    const allCacheKeys = [
      defaultCall(),
      call('const b = 2', fakeFilePath, fakeJestConfig),
      call(fakeSource, fakers.filePath('other-file.ts'), fakeJestConfig),
      call(fakeSource, fakeFilePath, '{"rootDir": "./sub"}'),
      call(fakeSource, fakeFilePath, fakeJestConfig, { instrument: true }),
      call(fakeSource, fakeFilePath, fakeJestConfig, { rootDir: '/child' }),
    ];

    mocks.babelJestCacheKey = 'another-babel-jest-cache-key';
    allCacheKeys.push(defaultCall());
    mocks.reset();

    mocks.tsConfig = '{"files": []}';
    allCacheKeys.push(defaultCall());
    mocks.reset();

    mocks.packageJson = '{"name": "dummy"}';
    allCacheKeys.push(defaultCall());
    mocks.reset();

    // uniq array should equal original
    expect(
      allCacheKeys.filter((k, i) => allCacheKeys.indexOf(k) === i),
    ).toEqual(allCacheKeys);
    allCacheKeys.forEach(cacheKey => {
      expect(cacheKey).toHaveLength(28);
    });
  }); // all different and 28 chars
}); // getCacheKey
