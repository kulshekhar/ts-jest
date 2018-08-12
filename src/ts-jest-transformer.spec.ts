import TsJestTransformer from './ts-jest-transformer';
import * as fakers from './__helpers__/fakers';
import * as babelCfg from './utils/babel-config';
import * as closesPkgJson from './utils/closest-package-json';
import * as TsJestProgram from './ts-program';

jest.mock('./ts-program');
jest.mock('./utils/closest-package-json');
jest.mock('./utils/backports');

const mocks = {
  babelConfig: undefined as any,
  set packageJson(val: any) {
    (closesPkgJson as any).__default = val;
  },
  set tsConfig(val: any) {
    (TsJestProgram as any).__tsConfig = val;
  },
  reset() {
    this.babelConfig = undefined;
    this.packageJson = { name: 'mock' };
    this.tsConfig = {};
  },
};
beforeAll(() => {
  jest
    .spyOn(babelCfg, 'loadDefault')
    .mockImplementation(() => mocks.babelConfig);
});
afterEach(() => {
  mocks.reset();
});

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
  ) => new TsJestTransformer().getCacheKey(...args);
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

    mocks.babelConfig = '{sourceMaps: true}';
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
