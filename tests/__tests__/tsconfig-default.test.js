'use strict';

jest.mock('path');

describe('get default ts config', () => {

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('path').__setBaseDir('./tests/tsconfig-default');
  });

  it('should correctly read tsconfig.json', () => {
    const {getTSConfig} = require('../../utils');
    const result = getTSConfig();

    expect(result).toEqual ({
      "sourceMap": false,
      "declaration": false,
      "target": 2,
      "module": 1,
      "moduleResolution": 2,
      "noEmitOnError": true,
      "noFallthroughCasesInSwitch": true,
      "noImplicitAny": false,
      "noImplicitReturns": true,
      "removeComments": true,
      "strictNullChecks": true,
      "jsx": 2,
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "allowSyntheticDefaultImports": false
    });

  });

});