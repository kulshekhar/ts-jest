# ts-jest  [![npm version](https://badge.fury.io/js/ts-jest.svg)](https://badge.fury.io/js/ts-jest) [![NPM downloads](https://img.shields.io/npm/dm/ts-jest.svg?style=flat)](https://npmjs.org/package/ts-jest) [![Greenkeeper badge](https://badges.greenkeeper.io/kulshekhar/ts-jest.svg)](https://greenkeeper.io/) [![Build Status for linux](https://travis-ci.org/kulshekhar/ts-jest.svg?branch=master)](https://travis-ci.org/kulshekhar/ts-jest) [![Build Status for Windows](https://ci.appveyor.com/api/projects/status/g8tt9qd7usv0tolb/branch/master?svg=true)](https://ci.appveyor.com/project/kulshekhar/ts-jest/branch/master) <img align="right" src="./logo.png" height="48">


**ts-jest** is a TypeScript preprocessor with source map support for Jest that lets you use Jest to test projects written in TypeScript.

---

[<img src="./docs/assets/troubleshooting.png" align="left" height="24"> Before reporting any issue, be sure to check the troubleshooting page](https://github.com/kulshekhar/ts-jest/wiki/Troubleshooting)

[<img src="./docs/assets/slack.png" align="left" height="24"> You can also find help on the ts-jest community on Slack](https://join.slack.com/t/ts-jest/shared_invite/enQtNDE1ODQ0OTEzMTczLWU2ZTk5YTMzYTE1YjBkZTk5ODI1NWU3NWU0NzhlOWJlZDNkYTRlM2Y3NWQ1YWVjMjc5Mjg1NmY1NTdkNWQ3MTA)

[<img src="./docs/assets/pull-request.png" align="left" height="24"> Looking for collaborators. Want to help improve ts-jest?](https://github.com/kulshekhar/ts-jest/issues/223)

---

# Table of Contents
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
  - [TypeScript configuration](#typescript-configuration)
  - [Module path mapping](#module-path-mapping)
  - [Using `babel-jest`](#using-babel-jest)
  - [TS compiler & error reporting](#ts-compiler--error-reporting)
  - [Ignore coverage on decorators](#ignore-coverage-on-decorators)
  - [extending](#extending)
- [Use cases](#use-cases)
  - [React Native](#react-native)
- [Angular 2](#angular-2)
- [Tips](#tips)
  - [Importing packages written in TypeScript](#importing-packages-written-in-typescript)
  - [Logging](#logging)
- [Known Limitations](#known-limitations)
  - [Known limitations for TS compiler options](#known-limitations-for-ts-compiler-options)
  - [`const enum` is not supported if `isolatedModules` is enabled](#const-enum-is-not-supported-if-isolatedmodules-is-enabled)
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
    "preset": "ts-jest"
  }
}
```
or create/modify the `jest.config.js`:
```js
module.exports = {
  preset: 'ts-jest',
};
```
This setup should allow you to write Jest tests in Typescript and be able to locate errors without any additional gymnastics.

### Versioning
From version `"jest": "17.0.0"` we are using same MAJOR.MINOR as [`Jest`](https://github.com/facebook/jest).
For `"jest": "< 17.0.0"` use `"ts-jest": "0.1.13"`. Docs for it see [here](https://github.com/kulshekhar/ts-jest/blob/e1f95e524ed62091736f70abf63530f1f107ec03/README.md).

You can try using ts-jest with `jest@next`; use at your own risk! (And file an issue if you find problems.)

### Coverage

Prior to version `20.0.0`, coverage reports could be obtained using the inbuilt coverage processor in ts-jest. Starting with version `20.0.0`, ts-jest delegates coverage processing to jest and no longer includes a coverage processor.

## Default Setup
ts-jest tries to ship with sensible defaults, to get you on your feet as quickly as possible.

### Sourcemap support
Sourcemaps should work out of the box. That means your stack traces should have the correct line numbers,
and you should be able to step through the TypeScript code using a debugger.

### Automatically finds tsconfig.json
ts-jest automatically located your `tsconfig` file.
If you want to compile typescript with a special configuration, you [can do that too](#typescript-configuration).

### Supports synthetic modules
If you're on a codebase where you're using synthetic default imports, e.g.
```javascript 1.6
//Regular imports
import * as React from 'react';

//Synthetic default imports:
import React from 'react';
```
ts-jest does that by using TypeScript 2.7+ `esModuleInterop` option. More details [here](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html).

### Supports automatic of jest.mock() calls
[Just like Jest](https://facebook.github.io/jest/docs/manual-mocks.html#using-with-es-module-imports) ts-jest
automatically hoist your `jest.mock()` calls to the top of their block.

## Configuration
If the default setup doesn't address your requirements, you can create a custom setup to suit your project. All ts-jest specific configuration is done in an object with the `ts-jest` key within jest `gobals` config:

```js
// package.json
{
  "jest": {
    "globals": {
      "ts-jest": {
        // ts-jest specific configuration
      }
    }
  }
}
```
**OR**
```js
// jest.config.js
module.exports = {
  globals: {
    'ts-jest': {
      // ts-jest specific configuration
    }
  }
}
```

In following documentation we'll show you examples as if you were using a `jest.config.js` file, but the same applies if you were putting the configuration optons within `package.json`'s `jest` section of course.

Any configuration options which is a path to some file can make the use of `<rootDir>`. It'll be replaced with the value of `rootDir` as in other Jest config options.

### TypeScript configuration
By default this package will try to locate `tsconfig.json` and use its compiler options for your `.ts` and `.tsx` files.

You can override this behavior with the `tsConfig` option of ts-jest. It can be:

- the path to a `tsconfig` JSON file (relative to `rootDir`):
  ```js
  // jest.config.js
  module.exports = {
    globals: {
      'ts-jest': {
        tsConfig: 'my-tsconfig.json'
      }
    }
  };
  ```

- a plain object containing the `compilerOptions`:
  ```js
  // jest.config.js
  module.exports = {
    globals: {
      'ts-jest': {
        tsConfig: {
          experimentalDecorators: true,
          // ...
        }
      }
    }
  };
  ```

For all available `tsc` options see [TypeScript docs](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

Note that files are transpiled as isolated modules. Because of that some compiler options have no effect: `declaration`, `declarationDir`, `esModuleInterop`, `inlineSourceMaps`, `inlineSources`, `lib`, `module`, `noEmit`, `noEmitOnError`, `out`, `outFile`, `paths`, `rootDirs`, `sourceMaps` and `types`. See TypeScript `transpileModule`'s [function source](https://github.com/Microsoft/TypeScript/blob/v3.0.1/src/services/transpile.ts#L44-L53).

### Module path mapping

If you use ["baseUrl"](https://www.typescriptlang.org/docs/handbook/module-resolution.html) and "paths" options for the compiler, see ["moduleNameMapper"](https://facebook.github.io/jest/docs/en/configuration.html#modulenamemapper-object-string-string) option on Jest docs.

For example, with the below config in your tsconfig:
```js
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@App/*": ["src/*"],
      "@Shared/*": ["src/Shared/*"]
    }
  }
}
```

...here's what your jest config should look like:
```js
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '@App/(.*)': '<rootDir>/src/$1',
    '@Shared/(.*)': '<rootDir>/src/Shared/$1'
  }
};
```

TS Jest provides a helper to automatically create this map from the `paths` compiler option of your TS config:

```js
// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig'); // replace with the path to your tsconfig.json file

module.exports = {
  // [...]
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */ )
};
```

### Using `babel-jest`
By default ts-jest does not rely on babel-jest. But you may want to use some babel plugins and stll be able to write TypeScript. This can be achieved using the `babelConfig` config key. It can be:

- `true`, in which case it'll use defaults from babelrc or any other found config file:
  ```js
  // jest.config.js
  module.exports = {
    globals: {
      'ts-jest': {
        babelConfig: true
      }
    }
  };
  ```

- the path to a babel config file:
  ```js
  // jest.config.js
  module.exports = {
    globals: {
      'ts-jest': {
        babelConfig: 'babelrc.test.js'
      }
    }
  };
  ```

- a plain object containing babel configuration:
  ```js
  // jest.config.js
  module.exports = {
    globals: {
      'ts-jest': {
        babelConfig: {
          plugins: [
            // ...
          ]
        }
      }
    }
  };
  ```

- `false`, in which case it'll disable the use of babel-jest (which is the default):
  ```js
  // jest.config.js
  module.exports = {
    globals: {
      'ts-jest': {
        babelConfig: false
      }
    }
  };
  ```

### TS compiler & error reporting

<center>=== To be documented ===</center>

### Ignore coverage on decorators

<center>=== To be documented ===</center>

### extending
You can extend the defaults shipped with ts-jest in its preset (this is only possible in an external `jest.config.js` file):
```js
// jest.config.js
const { jestPreset } = require('ts-jest');

module.exports = {
  // ...
  ...jestPreset,
  moduleFileExtensions: ['ts'],
  transform: {
    ...jestPreset.transform,
    // ...
  }
  // ...
};
```

## Use cases

### React Native

There is a few additional steps if you want to use it with React Native.

Install `babel-preset-react-native` modules.

```sh
npm install -D babel-preset-react-native
```

Ensure `.babelrc` contains:

```js
// .babelrc
{
  "presets": ["react-native"],
}
```

And your jest config should look like:

```js
// jest.config.js
const { jestPreset } = require('ts-jest');

module.exports = {
  ...jestPreset,
  preset: 'react-native',
  globals: {
    'ts-jest': {
      babelConfig: true
    }
  }
};
```

## Angular 2
When using Jest with Angular (a.k.a Angular 2) apps you will likely need to parse HTML templates. If you're unable to add `html-loader` to webpack config (e.g. because you don't want to eject from `angular-cli`) you can do so by using the `stringifyContentPathRegex` config option:

```js
// jest.config.js
const { jestPreset } = require('ts-jest');

module.exports = {
  // ...
  transform: {
    ...jestPreset.transform,
    '^.+\\.html$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      stringifyContentPathRegex: '\\.html$'
    }
  }
};
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
    "<rootDir>/node_modules/(?!@foo/bar)"
  ]
  // ...
}
```

By default Jest ignores everything in `node_modules`. This setting prevents Jest from ignoring the package you're interested in, in this case `@foo/bar`, while continuing to ignore everything else in `node_modules`.

### Logging

This package is using [`bs-logger`](https://www.npmjs.com/package/bs-logger).

Use environment variable `TS_JEST_LOG=xxx` to configure log targets. By default it'll log entries with level _warning_ and above to **stderr**.

See the examples in [there](https://github.com/huafu/bs-logger#using-targets) to configure different target(s).

When posting an issue, it's best to join the full log file which you can create in CWD using:
```sh
TS_JEST_LOG=ts-jest.log jest
# or
TS_JEST_LOG=ts-jest.log npm run test
```

## Known Limitations

### Known limitations for TS compiler options

If you use `"baseUrl": "<path_to_your_sources>"`, you also have to change `jest config` a little bit (also check [Module path mapping](#module-path-mapping) section):

```json
"jest": {
  "moduleDirectories": ["node_modules", "<path_to_your_sources>"]
}
```

### `const enum` is not supported if `isolatedModules` is enabled

This is due to a limitation in the ts-jest basic processor which compiles each test file individually, therefore ignoring implementations of ambient declarations. The TypeScript team currently have [no plan to support const enum inlining](https://github.com/Microsoft/TypeScript/issues/5243) for this particular compiler method. See [#112](https://github.com/kulshekhar/ts-jest/issues/112) and [#281](https://github.com/kulshekhar/ts-jest/issues/281) for more information.

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
