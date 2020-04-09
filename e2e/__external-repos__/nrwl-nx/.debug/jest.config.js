module.exports = {
  rootDir: '../',
  globals: {
    'ts-jest': {
      stringifyContentPathRegex: '\\.html?$',
      tsConfig: '<rootDir>/.debug/tsconfig.spec.json',
      astTransformers: [
        'jest-preset-angular/build/InlineFilesTransformer',
        'jest-preset-angular/build/StripStylesTransformer'
      ]
    }
  },
  testEnvironment: 'jest-environment-jsdom-sixteen',
  preset: 'jest-preset-angular',
  testURL: 'http://localhost/',
  transform: {
    '^.+\\.(ts|html)$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/.debug/test-setup.ts'],
  silent: false,
  transformIgnorePatterns: ['node_modules/(?!@ngrx)', '<rootDir>/dist/'],
  moduleNameMapper: {
    '^@ccxp-client/(.*)$': '<rootDir>/libs/$1/src/index.ts',
    '^@ccxp-client-testing/(.*)$': '<rootDir>/libs/$1/src/testing.ts',
    '^tools/(.*)$': '<rootDir>/tools/$1',
    '\\.svg$': 'identity-obj-proxy'
  }
};
