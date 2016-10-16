# ts-jest

[![Build Status](https://semaphoreci.com/api/v1/k/ts-jest/branches/master/badge.svg)](https://semaphoreci.com/k/ts-jest)

**Note:** This is currently just a hack and might not be suitable for all setups.

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Usage](#usage)
- [Options](#options)
- [How to Contribute](#how-to-contribute)
  - [Quickstart to run tests (only if you're working on this package)](#quickstart-to-run-tests-only-if-youre-working-on-this-package)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

> **Note:** This repo uses code from the [source-map-support](https://github.com/evanw/node-source-map-support) package to show errors with mapped locations.

To use this in your project, run:
```sh
npm install --save-dev ts-jest
```
Modify your project's `package.json` so that the `jest` section looks something like:
```json
{
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/ts-jest/preprocessor.js",
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js"
    ]
  }
}
```
This setup should allow you to write Jest tests in Typescript and be able to locate errors without any additional gymnastics.

By default `jest` does not provide code coverage remapping for transpiled codes, so if you'd like to have code coverage it needs additional coverage remapping. This can be done via writing custom processing script, or configure `testResultsProcessor` to use built-in coverage remapping in `ts-jest`.
```json
{
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/ts-jest/preprocessor.js",
    "testResultsProcessor": "<rootDir>/node_modules/ts-jest/coverageprocessor.js",
    ...
  }
}
```

## Options
By default this package will try to locate `tsconfig.json` and use its compiler options for your `.ts` and `.tsx` files.
But you are able to override this behaviour and provide another path to your config for TypeScript by using `__TS_CONFIG__` option in `globals` for `jest`:
```json
{
  "jest": {
    "globals": {
      "__TS_CONFIG__": "my-tsconfig.json"
    }
  }
}
```
Or even declare options for `tsc` instead of using separate config, like this:
```json
{
  "jest": {
    "globals": {
      "__TS_CONFIG__": {
        "module": "commonjs",
        "jsx": "react"
      }
    }
  }
}
```
For all available options see [TypeScript docs](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

## How to Contribute
If you have any suggestions/pull requests to turn this into a useful package, just open an issue and I'll be happy to work with you to improve this.

### Quickstart to run tests (only if you're working on this package)

```sh
git clone https://github.com/kulshekhar/ts-jest
cd ts-jest
npm install
npm test
```

## License

Copyright (c) Kulshekhar Kabra.
This source code is licensed under the [MIT license](LICENSE).