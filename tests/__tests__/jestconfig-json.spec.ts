const getPackageRoot = require('jest-util').getPackageRoot;

describe('get json jest config', () => {
  let yargsMock;
  let getJestConfig;

  beforeEach(() => {
    jest.resetModules();
    yargsMock = jest.fn();
    jest.setMock('yargs', yargsMock);
    getJestConfig = require('../../src/utils').getJestConfig;
  });

  it('should able to read config from json', () => {
    yargsMock.mockReturnValueOnce({
      argv: {
        _: [],
        config: 'tests/jestconfig-test/jest.json',
        '$0': 'node_modules\\jest\\bin\\jest.js'
      }
    });

    const jestConfig = getJestConfig(getPackageRoot());

    const { collectCoverage } = jestConfig;
    const { coverageReporters, coverageDirectory, collectCoverageFrom} = jestConfig.config;

    expect(collectCoverage).toBeUndefined();
    expect(coverageReporters).toEqual(['html', 'json', 'text']);
    expect(coverageDirectory).toContain('test_coverage_dir');
    expect(collectCoverageFrom).toEqual(['src/**/*.tsx', 'src/**/*.ts']);
  });

  it('should able to read config from command arg with json', () => {
    yargsMock.mockReturnValueOnce({
      argv: {
        _: [],
        coverage: true,
        config: 'tests/jestconfig-test/jest.json',
        '$0': 'node_modules\\jest\\bin\\jest.js'
      }
    });

    const jestConfig = getJestConfig(getPackageRoot());

    const { collectCoverage } = jestConfig;
    const { coverageReporters, coverageDirectory, collectCoverageFrom} = jestConfig.config;

    expect(collectCoverage).toBeTruthy();
    expect(coverageReporters).toEqual(['html', 'json', 'text']);
    expect(coverageDirectory).toContain('test_coverage_dir');
    expect(collectCoverageFrom).toEqual(['src/**/*.tsx', 'src/**/*.ts']);
  });
});