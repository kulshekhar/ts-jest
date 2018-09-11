---
title: Configuration
---
ts-jest configuration is done within Jest configuration object. This latest can be in `package.json` under the `jest` property, or in its own `jest.config.js` file.
The later is preferred since it's more customizable, but it depends on your needs and preference.

## Jest preset

### Basic usage

In most cases, simply adding `preset: 'ts-jest'` to your Jest config should be enough to start using TypeScript with Jest (assuming you did add `ts-jest` to your dev. dependencies of course):

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  preset: 'ts-jest'
};
```

</div><div class="col-md-6" markdown="block">

```js
// OR package.json
{
  // [...]
  "jest": {
    "preset": "ts-jest"
  }
}
```

</div></div>

### Advanced

The ts-jest preset can also be used with other options.
If you're already using another preset, you might want only some specific settings from the ts-jest preset.
In this case you'll need to use the JavaScript version of Jest config:

```js
// jest.config.js
const { jestPreset: tsJestPreset } = require('ts-jest');

module.exports = {
  // [...]
  transform: {
    ...tsJestPreset.transform,
    // [...]
  }
}
```

## Paths mapping

If you use ["baseUrl" and "paths" options](https://www.typescriptlang.org/docs/handbook/module-resolution.html) in your `tsconfig` file, you should make sure the ["moduleNameMapper"](https://facebook.github.io/jest/docs/en/configuration.html#modulenamemapper-object-string-string) option in your Jest config is setup accordingly.

TSJest provides a helper to transform the mapping from `tsconfig` to Jest config format, but it needs the `.js` version of the config file.

### Example:

#### TypeScript config

With the below config in your `tsconfig`:
```js
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@App/*": ["src/*"],
      "lib/*": ["common/*"]
    }
  }
}
```

#### Jest config (without helper):

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  moduleNameMapper: {
    '^@App/(.*)$': '<rootDir>/src/$1',
    '^lib/(.*)$': '<rootDir>/common/$1'
  }
};
```

</div><div class="col-md-6" markdown="block">

```js
// OR package.json
{
  // [...]
  "jest": {
    "moduleNameMapper": {
      "^@App/(.*)$": "<rootDir>/src/$1",
      "^lib/(.*)$": "<rootDir>/common/$1"
    }
  }
}
```

</div></div>

#### Jest config (with helper):

```js
// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require('./tsconfig');

module.exports = {
  // [...]
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */ )
};
```

## ts-jest options

### Introduction
All configuration of ts-jest specific options are located under `globals.ts-jest` path of your Jest config:

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      // ts-jest configuration goes here
    }
  }
};
```

</div><div class="col-md-6" markdown="block">

```js
// OR package.json
{
  // [...]
  "jest": {
    "globals": {
      "ts-jest": {
        // ts-jest configuration goes here
      }
    }
  }
}
```

</div></div>

### Options

All options have default values which should fit most of the projects. Click on the option's name to see details and example(s).

| Option | Description | Type | Default |
|---|---|---|---|
| [**`compiler`**][compiler] | [TypeScript module to use as compiler.][compiler] | `string` | `"typescript"` |
| [**`tsConfig`**][tsConfig] | [TypeScript compiler related configuration.][tsConfig] | `string`\|`object`\|`boolean` | _auto_ |
| [**`isolatedModules`**][isolatedModules] | [Disable type-checking][isolatedModules] | `boolean` | `false` |
| [**`diagnostics`**][diagnostics] | [Diagnostics related configuration.][diagnostics] | `boolean`\|`object` | `true` |
| [**`babelConfig`**][babelConfig] | [Babel(Jest) related configuration.][babelConfig] | `boolean`\|`object` | _disabled_ |
| [**`stringifyContentPathRegex`**][stringifyContentPathRegex] | [Files which will become modules returning self content.][stringifyContentPathRegex] | `string`\|`RegExp` | _disabled_ |

### Upgrading

You can use the `config:migrate` tool of ts-jest CLI if you're coming from an older version to help you migrate your Jest configuration.

<div class="row"><div class="col-md-6" markdown="block">

_If you're using `jest.config.json`:_
```sh
npx ts-jest config:migrate jest.config.js
```

</div><div class="col-md-6" markdown="block">

_If you're using `jest` config property of `package.json`:_
```sh
npx ts-jest config:migrate package.json
```

</div></div>

[compiler]: compiler
[tsConfig]: tsConfig
[isolatedModules]: isolatedModules
[diagnostics]: diagnostics
[babelConfig]: babelConfig
[stringifyContentPathRegex]: stringifyContentPathRegex
