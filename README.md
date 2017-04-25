# ts-jest

[![npm version](https://badge.fury.io/js/ts-jest.svg)](https://badge.fury.io/js/ts-jest)
[![NPM downloads](https://img.shields.io/npm/dm/ts-jest.svg?style=flat)](https://npmjs.org/package/ts-jest)
[![Greenkeeper badge](https://badges.greenkeeper.io/kulshekhar/ts-jest.svg)](https://greenkeeper.io/)

[![Build Status for linux](https://travis-ci.org/kulshekhar/ts-jest.svg?branch=master)](https://travis-ci.org/kulshekhar/ts-jest)
[![Build Status for Windows](https://ci.appveyor.com/api/projects/status/g8tt9qd7usv0tolb/branch/master?svg=true)](https://ci.appveyor.com/project/kulshekhar/ts-jest/branch/master)



## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Versioning](#versioning)
- [Usage](#usage)
- [Options](#options)
  - [Known limitations for TS compiler options](#known-limitations-for-ts-compiler-options)
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

> **Notes:**
> * If you're experiencing remapping failure with source lookup, it may due to pre-created cache from `jest`. It can be manually deleted, or execute with [`--no-cache`](https://facebook.github.io/jest/docs/troubleshooting.html#caching-issues) to not use those.
> * Remapped reports will be copied to `remapped` directory in coverage directory (e.g. `coverage/remapped`).

### React Native

There is a few additional steps if you want to use it with React Native.

Install `babel-jest` and `babel-preset-react-native` modules.

```sh
npm install -D babel-jest babel-preset-react-native
```

Ensure `.babelrc` contains:

```json
{
  "presets": ["react-native"]
}
```

In `package.json`, inside `jest` section, the `transform` should be like this:
```json
"transform": {
  "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
  ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
}
```

Fully completed jest section should look like this:

```json
"jest": {
    "preset": "react-native",
    "transform": {
      "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
      ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js"
    ]
  }
```
If only testing typescript files then remove the `js` option in the testRegex.


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
Note that if you haven't explicitly set the `module` property in the `__TS_CONFIG__` setting (either directly or through a separate configuration file), it will be overwritten to `commonjs` (regardless of the value in `tsconfig.json`) since that is the format Jest expects. This only happens during testing.

When using Jest with Angular (a.k.a Angular 2) apps you will likely need to parse HTML templates. If you're unable to add `html-loader` to webpack config (e.g. because you don't want to eject from `angular-cli`) you can do so by defining `__TRANSFORM_HTML__` key in `globals` for `jest`.

```json
{
  "jest": {
    "globals": {
      "__TRANSFORM_HTML__": true
    }
  }
}
```

You'll also need to extend your `transform` regex with `html` extension:
```json
{
  "jest": {
    "transform": {
      "^.+\\.(ts|tsx|js|html)$": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    }
  }
}
```

For all available options see [TypeScript docs](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

### Known limitations for TS compiler options
- You can't use `"target": "ES6"` while using `node v4` in your test environment;
- You can't use `"jsx": "preserve"` for now (see [progress of this issue](https://github.com/kulshekhar/ts-jest/issues/63));
- If you use `"baseUrl": "<path_to_your_sources>"`, you also have to change `jest config` a little bit:
```json
"jest": {
  "moduleDirectories": ["node_modules", "<path_to_your_sources>"]
}
```

## How to Contribute
If you have any suggestions/pull requests to turn this into a useful package, just open an issue and I'll be happy to work with you to improve this.

### Quickstart to run tests (only if you're working on this package)

```sh
git clone https://github.com/kulshekhar/ts-jest
cd ts-jest
npm install
npm test
```

**Note:** If you are cloning on Windows, you may have to run `git config --system core.longpaths true` for Windows to stop complaining about long filenames.

## License

Copyright (c) [Authors](AUTHORS).
This source code is licensed under the [MIT license](LICENSE).
