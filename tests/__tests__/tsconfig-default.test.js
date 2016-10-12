'use strict';

jest.mock('path');

describe('get default ts config', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-test');
  });

  it('should correctly read tsconfig.json', () => {
    const {getTSConfig} = require('../../dist/utils');
    const result = getTSConfig();

    expect(result).toEqual ({
      "target": 2,
      "module": 1,
      "moduleResolution": 2,
      "noEmitOnError": false,
      "jsx": 2
    });
  });

  it('should not read my-tsconfig.json', () => {
    const {getTSConfig} = require('../../dist/utils');
    const result = getTSConfig();

    expect(result).not.toEqual ({
      "target": 2,
      "module": 1,
      "moduleResolution": 2,
      "noEmitOnError": true,
      "jsx": 2
    });
  });
  
  it('should not read inline tsconfig options', () => {
    const {getTSConfig} = require('../../dist/utils');
    const result = getTSConfig();

    expect(result).not.toEqual ({
      "module": 1,
      "jsx": 2
    });
  });

});