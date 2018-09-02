---
title: Configuration
---
TSJest configuration is done within Jest configuration object. This latest can be in `package.json` under the `jest` property, or in its own `jest.config.js` file. The later is prefered since it's a JavaScript file, but it depends on your needs and preference.

## Jest preset

### Basic usage

In most of the case, simply adding `preset: 'ts-jest'` to your Jest config should be enough starting using TypeScript with Jest (suposing you did add `ts-jest` to your dev. npm dependencies of course):

<div class="row"><div class="col-md-6" markdown="block">
```js
// package.json
{
  // [...]
  "jest": {
    "preset": "ts-jest"
  }
}
```
</div><div class="col-md-6" markdown="block">
```js
// jest.config.js
module.exports = {
  // [...]
  preset: 'ts-jest'
};
```
</div></div>

### Advanced

Preset can also be used alongside other options, but when you are already using another preset (ie `preset` is already set to something else than `ts-jest`), you'll want to "pick" some settings from it. In this case, you'll need to use the JavaScript version of Jest config:

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

## TSJest options

### Introduction
All configration of TSJest specific options are located under `globals.ts-jest` path of your Jest config:

<div class="row"><div class="col-md-6" markdown="block">
```js
// package.json
{
  // [...]
  "jest": {
    "globals": {
      "ts-jest": {
        // TSJest configuration goes here
      }
    }
  }
}
```
</div><div class="col-md-6" markdown="block">
```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      // TSJest configuration goes here
    }
  }
};
```
</div></div>

### Options

All options have default values which should fit most of the projects.

- **`compiler`**: TypeScript module to use as compiler.
- **`tsConfig`**: TypeScript compiler related configuration.
- **`isolatedModules`**: Enables/disables the TypeScript language service.
- **`diagnostics`**: Diagnostics related configuration.
- **`babelConfig`**: Babel(Jest) related configuration.
- **`stringifyContentPathRegex`**: Configure which file(s) will become a module returning its content.
