# ts-jest

[![npm version](https://badge.fury.io/js/ts-jest.svg)](https://badge.fury.io/js/ts-jest)
[![NPM downloads](https://img.shields.io/npm/dm/ts-jest.svg?style=flat)](https://npmjs.org/package/ts-jest)
[![Greenkeeper badge](https://badges.greenkeeper.io/kulshekhar/ts-jest.svg)](https://greenkeeper.io/)

[![Build Status for linux](https://travis-ci.org/kulshekhar/ts-jest.svg?branch=master)](https://travis-ci.org/kulshekhar/ts-jest)
[![Build Status for Windows](https://ci.appveyor.com/api/projects/status/g8tt9qd7usv0tolb/branch/master?svg=true)](https://ci.appveyor.com/project/kulshekhar/ts-jest/branch/master)

**Important note: When using React 16 with Node version 8, you might see wrong line numbers for errors originating from tsx files. There's [an issue with more details on this](https://github.com/kulshekhar/ts-jest/issues/334)**

> Note: Looking for collaborators. [Want to help improve ts-jest?](https://github.com/kulshekhar/ts-jest/issues/223)

ts-jest is a TypeScript preprocessor with source map support for Jest that lets you use Jest to test projects written in TypeScript.

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Usage](#usage)
  - [Versioning](#versioning)
  - [Coverage](#coverage)
- [Default Setup](#default-setup)
  - [Sourcemap support](#sourcemap-support)
  - [Automatically finds tsconfig.json](#automatically-finds-tsconfigjson)
  - [Supports synthetic modules](#supports-synthetic-modules)
  - [Supports automatic of jest.mock() calls](#supports-automatic-of-jestmock-calls)
- [Configuration](#configuration)
  - [tsconfig](#tsconfig)
  - [Module path mapping](#module-path-mapping)
  - [Skipping Babel](#skipping-babel)
  - [Using `.babelrc`](#using-babelrc)
  - [Using a custom Babel config](#using-a-custom-babel-config)
  - [TS compiler & error reporting](#ts-compiler--error-reporting)
  - [Ignore coverage on decorators](#ignore-coverage-on-decorators)
- [Use cases](#use-cases)
  - [React Native](#react-native)
- [Angular 2](#angular-2)
- [Using ES2015+ features in Javascript files](#using-es2015-features-in-javascript-files)
- [Tips](#tips)
  - [Importing packages written in TypeScript](#importing-packages-written-in-typescript)
- [Known Limitations](#known-limitations)
  - [Known limitations for TS compiler options](#known-limitations-for-ts-compiler-options)
  - [Known Limitations for hoisting](#known-limitations-for-hoisting)
  - [`const enum` is not supported](#const-enum-is-not-supported)
- [How to Contribute](#how-to-contribute)
  - [Quickstart to run tests (only if you're working on this package)](#quickstart-to-run-tests-only-if-youre-working-on-this-package)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

To use this in your project, run:
```sh
npm install --save-dev ts-jest @types/jest
```
If you don't already have jest installed,
```sh
npm install --save-dev jest ts-jest @types/jest
```
Modify your project's `package.json` so that the `jest` section looks something like:
```json
{
  "jest": {
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ]
  }
}
```
This setup should allow you to write Jest tests in Typescript and be able to locate errors without any additional gymnastics.

### Versioning
From version `"jest": "17.0.0"` we are using same MAJOR.MINOR as [`Jest`](https://github.com/facebook/jest).
For `"jest": "< 17.0.0"` use `"ts-jest": "0.1.13"`. Docs for it see [here](https://github.com/kulshekhar/ts-jest/blob/e1f95e524ed62091736f70abf63530f1f107ec03/README.md).

You can try using ts-jest with `jest@test`; use at your own risk! (And file an issue if you find problems.)

### Coverage

Prior to version `20.0.0`, coverage reports could be obtained using the inbuilt coverage processor in ts-jest. Starting with version `20.0.0`, ts-jest delegates coverage processing to jest and no longer includes a coverage processor.

> Please note that the `outDir` property in the `jest` configuration section is removed in coverage mode, due to [#201](https://github.com/kulshekhar/ts-jest/issues/201).

## Default Setup
ts-jest tries to ship with sensible defaults, to get you on your feet as quickly as possible.

### Sourcemap support
Sourcemaps should work out of the box. That means your stack traces should have the correct line numbers,
and you should be able to step through the TypeScript code using a debugger.

### Automatically finds tsconfig.json
ts-jest automatically located your `tsconfig` file.
If you want to compile typescript with a special configuration, you [can do that too](#tsconfig)

### Supports synthetic modules
If you're on a codebase where you're using synthetic default imports, e.g.
```javascript 1.6
//Regular imports
import * as React from 'react';

//Synthetic default imports:
import React from 'react';
```
ts-jest tries to support that. If `allowSyntheticDefaultImports` is set to true in your `tsconfig` file, it uses babel
to automatically create the synthetic default exports for you - nothing else needed.
You can opt-out of this behaviour with the [skipBabel flag](#skipping-babel)

**Typescript 2.7 has built-in support for this feature via the `esModuleInterop` flag. We're looking to deprecate this feature.
Please use `esModuleInterop` instead. More details [here](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html)** 

### Supports automatic of jest.mock() calls
[Just like Jest](https://facebook.github.io/jest/docs/manual-mocks.html#using-with-es-module-imports) ts-jest
automatically uses babel to hoist your `jest.mock()` calls to the top of your file.
You can opt-out of this behaviour with the [skipBabel flag](#skipping-babel)

## Configuration
If the default setup doesn't address your requirements, you can create a custom setup to suit your project.

### tsconfig
By default this package will try to locate `tsconfig.json` and use its compiler options for your `.ts` and `.tsx` files.

You can override this behaviour by pointing ts-jest to a custom TypeScript configuration file.
You can do this by setting the `tsConfigFile` option in your global variables under the `ts-jest` key to path of the
custom configuration file (relative to the project's root directory)

```json
{
  "jest": {
    "globals": {
      "ts-jest": {
        "tsConfigFile": "my-tsconfig.json"
      }
    }
  }
}
```
**Warning: In the past, a `__TS_CONFIG__` section could be used to provide an inline TypeScript configuration. Going forward, all custom configurations should be in a different file and the `tsConfigFile` key in the `ts-jest` section (under `globals`) should point to this file (as shown above). You can ignore this if the configuration you want is identical to the main `tsconfig.json`.**

For all available `tsc` options see [TypeScript docs](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

Note that if you haven't explicitly set the `module` property through a separate configuration file with `tsConfigFile`, it will be overwritten to `commonjs` (regardless of the value in `tsconfig.json`) since that is the format Jest expects. This only happens during testing. 

If you *have* explicitly set the `module` property but to a different value than `commonjs`, Jest may throw errors. In that case, a practical workaround is to make a `tsconfig.jest.json` file which [`extends`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html#configuration-inheritance-with-extends) your real `tsconfig.json` but sets `module` to `commonjs`:

```js
// tsconfig.jest.json
{
  "extends": "./tsconfig",
  "compilerOptions": {
    "module": "commonjs"
  }
}
```

### Module path mapping

If you use ["baseUrl"](https://www.typescriptlang.org/docs/handbook/module-resolution.html) and "paths" options for the compiler, see ["moduleNameMapper"](https://facebook.github.io/jest/docs/en/configuration.html#modulenamemapper-object-string-string) option on Jest docs.

### Skipping Babel
If you don't use mocks, or synthetic default imports you can skip the babel-transpilation step.
This means `jest.mock()` calls will not be hoisted to the top,
and synthetic default exports will never be created.
Simply add skipBabel to your global variables under the `ts-jest` key:
```json
//This will skip babel transpilation
{
  "jest": {
    "globals": {
      "ts-jest": {
        "skipBabel": true
      }
    }
  }
}
```

### Using `.babelrc`

When using Babel, ts-jest, by default, doesn't use the `.babelrc` file. If you want ts-jest to use `.babelrc`, you should set the `globals > ts-jest > useBabelrc` flag to `true` in your `jest` configuration.

```json
{
  "jest": {
    "globals": {
      "ts-jest": {
        "useBabelrc": true
      }
    }
  }
}
```

### Using a custom Babel config

In some cases, projects may not want to have a `.babelrc` file, but still need to provide custom Babel configuration. In these cases, you can provide a Babel config directly to `ts-jest` using the `globals > ts-jest > babelConfig` option in your `jest` configuration.

```json
{
  "jest": {
    "globals": {
      "ts-jest": {
        "babelConfig": {
          "presets": ["env"]
        }
      }
    }
  }
}
```

Note that if you also set the `useBabelrc` option to `true`, any configuration passed using this method will be overwritten by corresponding keys in `.babelrc` files.

### TS compiler & error reporting
If you want to enable Syntactic & Semantic TypeScript error reporting you can enable this through `enableTsDiagnostics` flag;

```json
{
  "jest": {
    "globals": {
      "ts-jest": {
        "enableTsDiagnostics": true
      }
    }
  }
}
```

### Ignore coverage on decorators

**Note:** This is an experimental feature, comes with no guarantees and could be removed if it causes more problems than it solves

If you want to ignore coverage on decorators you can enable this through `ignoreCoverageForDecorators` and `ignoreCoverageForAllDecorators` flags. If you enable the first option you have to add the `/* istanbul ignore decorator */` comment after the decorator. If you choose the second option all decorators will be ignored.

```json
{
  "jest": {
    "globals": {
      "ts-jest": {
        "ignoreCoverageForDecorators": true,
        "ignoreCoverageForAllDecorators": true
      }
    }
  }
}
```

## Use cases

### React Native

There is a few additional steps if you want to use it with React Native.

Install `babel-jest` and `babel-preset-react-native` modules.

```sh
npm install -D babel-jest babel-preset-react-native
```

Ensure `.babelrc` contains:

```json
{
  "presets": ["react-native"],
  "sourceMaps": "inline"
}
```

In `package.json`, inside `jest` section, the `transform` should be like this:
```json
"transform": {
  "^.+\\.jsx?$": "<rootDir>/node_modules/babel-jest",
  "^.+\\.tsx?$": "ts-jest"
}
```

Fully completed jest section should look like this:

```json
"jest": {
    "preset": "react-native",
    "transform": {
      "^.+\\.jsx?$": "<rootDir>/node_modules/babel-jest",
      "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ],
    "globals": {
      "ts-jest": {
        "useBabelrc": true
      }
    }
  }
```
If only testing typescript files then remove the `js` option in the testRegex.

## Angular 2
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
      "^.+\\.(tsx?|html)$": "ts-jest"
    }
  }
}
```

## Using ES2015+ features in Javascript files

The default setup shown here picks up only `.ts` and `.tsx` files. However, if there are javascript files in your project that use ES2015+ features (spread operator, import, etc), you probably want them processed. There are two ways you can do this:

- use ts-jest to process js files

````
    "transform": {
      "^.+\\.(t|j)sx?$": "ts-jest"
    }
````

- use another transformer to process js files

```
    "transform": {
      "^.+\\.jsx?$": "<rootDir>/node_modules/babel-jest",
      "^.+\\.tsx?$": "ts-jest"
    }
```

## Tips
### Importing packages written in TypeScript

If you have dependencies on npm packages that are written in TypeScript but are
**not** published in ES5 you have to tweak your configuration. For example
you depend on a private scoped package `@foo/bar` you have to add following to
your Jest configuration:

```js
{
  // ...
  "transformIgnorePatterns": [
    "<rootDir>/node_modules/(?!@foo)"
  ]
  // ...
}
```

By default Jest ignores everything in `node_modules`. This setting prevents Jest from ignoring the package you're interested in, in this case `@foo`, while continuing to ignore everything else in `node_modules`.


## Known Limitations
### Known limitations for TS compiler options
- You can't use `"target": "ES6"` while using `node v4` in your test environment;
- You can't use `"jsx": "preserve"` for now (see [progress of this issue](https://github.com/kulshekhar/ts-jest/issues/63));
- If you use `"baseUrl": "<path_to_your_sources>"`, you also have to change `jest config` a little bit (also check [Module path mapping](#module-path-mapping) section):
```json
"jest": {
  "moduleDirectories": ["node_modules", "<path_to_your_sources>"]
}
```

### Known Limitations for hoisting
If the `jest.mock()` calls is placed after actual code, (e.g. after functions or classes) and `skipBabel` is not set,
the line numbers in stacktraces will be off.
We suggest placing the `jest.mock()` calls after the imports, but before any actual code.

### `const enum` is not supported

This is due to a limitation in the ts-jest preprocessor which compiles each test file individually, therefore ignoring implementations of ambient declarations. The TypeScript team currently have [no plan to support const enum inlining](https://github.com/Microsoft/TypeScript/issues/5243) for this particular compiler method. See [#112](https://github.com/kulshekhar/ts-jest/issues/112) and [#281](https://github.com/kulshekhar/ts-jest/issues/281) for more information.

One possible workaround is to manually inline usage of const enum values - i.e. in your code, use `let x: Enum = 1 as Enum` as opposed to `let x: Enum = Enum.FirstValue`. This allows you to keep the type checking on enums without running into this issue.

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
