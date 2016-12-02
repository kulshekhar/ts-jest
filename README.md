# ts-jest

[![Build Status for node v7](https://travis-badges.herokuapp.com/repos/kulshekhar/ts-jest/branches/master?job=0)](https://travis-ci.org/kulshekhar/ts-jest)
[![Build Status for node v6](https://travis-badges.herokuapp.com/repos/kulshekhar/ts-jest/branches/master?job=1)](https://travis-ci.org/kulshekhar/ts-jest)
[![Build Status for node v4](https://travis-badges.herokuapp.com/repos/kulshekhar/ts-jest/branches/master?job=2)](https://travis-ci.org/kulshekhar/ts-jest)
[![Build Status for Windows](https://ci.appveyor.com/api/projects/status/g8tt9qd7usv0tolb/branch/master?svg=true)](https://ci.appveyor.com/project/kulshekhar/ts-jest/branch/master)
[![npm version](https://badge.fury.io/js/ts-jest.svg)](https://badge.fury.io/js/ts-jest)
[![dependencies](https://david-dm.org/kulshekhar/ts-jest.svg)](https://www.npmjs.com/package/ts-jest)

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Versioning](#versioning)
- [Usage](#usage)
- [Options](#options)
- [How to Contribute](#how-to-contribute)
  - [Quickstart to run tests (only if you're working on this package)](#quickstart-to-run-tests-only-if-youre-working-on-this-package)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Versioning
From version `"jest": "17.0.0"` we are using same MAJOR.MINOR as [`Jest`](https://github.com/facebook/jest).  
For `"jest": "< 17.0.0"` use `"ts-jest": "0.1.13"`. Docs for it see [here](https://github.com/kulshekhar/ts-jest/blob/e1f95e524ed62091736f70abf63530f1f107ec03/README.md).

## Usage

To use this in your project, run:
```sh
npm install --save-dev ts-jest
```
Modify your project's `package.json` so that the `jest` section looks something like:
```json
{
  "jest": {
    "transform": {
      ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
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
    "transform": {
      ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testResultsProcessor": "<rootDir>/node_modules/ts-jest/coverageprocessor.js"
  }
}
```

> **Note:** If you're experiencing remapping failure with source lookup, it may due to pre-created cache from `jest`. It can be manually deleted, or execute with [`--no-cache`](https://facebook.github.io/jest/docs/troubleshooting.html#caching-issues) to not use those.

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
> **Note:** You can't target `ES6` while using `node v4` in your test environment.

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

Copyright (c) [Authors](AUTHORS).  
This source code is licensed under the [MIT license](LICENSE).
