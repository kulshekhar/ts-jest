'use strict';

jest.mock('path');

describe('get inline ts config', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-default');
  });

  it('should correctly read inline tsconfig options', () => {
    const {getTSConfig} = require('../../utils');
    const result = getTSConfig({
      "__TS_CONFIG__": {
        "module": "commonjs",
        "jsx": "react"
      }
    });

    expect(result).toEqual ({
      "module": 1,
      "jsx": 2
    });

  });

});