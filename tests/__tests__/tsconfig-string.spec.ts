import { } from 'jest';
import { } from 'node';

jest.mock('path');

describe('get ts config from string', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-test');
  });

  it('should correctly read my-tsconfig.json', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'my-tsconfig.json'
    });

    expect(result).toEqual ({
      'target': 2,
      'module': 1,
      'moduleResolution': 2,
      'noEmitOnError': true,
      'jsx': 2
    });
  });

  it('should not read tsconfig.json', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'my-tsconfig.json'
    });

    expect(result).not.toEqual ({
      'target': 2,
      'module': 1,
      'moduleResolution': 2,
      'noEmitOnError': false,
      'jsx': 2
    });
  });

  it('should not read inline tsconfig options', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'my-tsconfig.json'
    });

    expect(result).not.toEqual ({
      'module': 1,
      'jsx': 2
    });
  });

  it('should correctly resolve the "extends" directive', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'extends-tsconfig.json'
    });

    expect(result).toEqual ({
      'target': 2,
      'module': 1,
      'moduleResolution': 2,
      'noEmitOnError': true,
      'jsx': 2
    });
  });

  it('should correctly override any config in the "extends" directive', () => {
    const {getTSConfig} = require('../../src/utils');
    const result = getTSConfig({
      '__TS_CONFIG__': 'extends-with-overrides-tsconfig.json'
    });

    expect(result).toEqual ({
      'target': 1,
      'module': 1,
      'moduleResolution': 2,
      'noEmitOnError': true,
      'jsx': 2,
      'noImplicitAny': true
    });
  });

});
