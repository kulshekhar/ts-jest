const getPackageRoot = require('jest-util').getPackageRoot;

describe('get package json config', () => {
  let yargsMock;
  let getJestConfig;

  beforeEach(() => {
    jest.resetModules();
    yargsMock = jest.fn();
    jest.setMock('yargs', yargsMock);
    getJestConfig = require('../../src/utils').getJestConfig;
  });

  it('should able to read config from package.json', () => {
    yargsMock.mockReturnValueOnce({
      argv: {
        _: [],
        '$0': 'node_modules\\jest\\bin\\jest.js'
      }
    });

    const jestConfig = getJestConfig(getPackageRoot());

    const { collectCoverage } = jestConfig;
    const { coverageReporters, coverageDirectory, collectCoverageFrom} = jestConfig.config;

    expect(collectCoverage).toBeUndefined();
    expect(coverageReporters).toEqual(['text']);
    expect(collectCoverageFrom).toEqual(['src/**/*.tsx', 'src/**/*.ts']);
  });

  it('should able to read config from command arg with package.json', () => {
    yargsMock.mockReturnValueOnce({
      argv: {
        _: [],
        coverage: true,
        '$0': 'node_modules\\jest\\bin\\jest.js'
      }
    });

    const jestConfig = getJestConfig(getPackageRoot());

    const { collectCoverage } = jestConfig;
    const { coverageReporters, coverageDirectory, collectCoverageFrom} = jestConfig.config;

    expect(collectCoverage).toBeTruthy();
    expect(coverageReporters).toEqual(['text']);
    expect(collectCoverageFrom).toEqual(['src/**/*.tsx', 'src/**/*.ts']);
  });
});