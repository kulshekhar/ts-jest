---
id: options
title: Options
---

### Introduction

All `ts-jest` specific options are located under the `globals.ts-jest` path of your Jest config:

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

```json5
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

#### IDE `ts-jest` config suggestion

To utilize IDE suggestions, you can use `JSDoc` comments to provide suggested `ts-jest` configs for your Jest config:

```js
/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  // [...]
  globals: {
    'ts-jest': {
      // ts-jest configuration goes here and your IDE will suggest which configs when typing
    }
  }
};

module.exports = config;
```

### Options

All options have default values which should fit most of the projects. Click on the option's name to see details and example(s).

| Option | Description | Type | Default |
|---|---|---|---|
| [**`compiler`**][compiler] | [TypeScript module to use as compiler.][compiler] | `string` | `"typescript"` |
| [**`tsconfig`**][tsconfig] | [TypeScript compiler related configuration.][tsconfig] | `string`\|`object`\|`boolean` | _auto_ |
| [**`isolatedModules`**][isolatedModules] | [Disable type-checking][isolatedModules] | `boolean` | _disabled_ |
| [**`astTransformers`**][astTransformers] | [Custom TypeScript AST transformers][astTransformers] | `object` | _auto_ |
| [**`diagnostics`**][diagnostics] | [Diagnostics related configuration.][diagnostics] | `boolean`\|`object` | _enabled_ |
| [**`babelConfig`**][babelConfig] | [Babel(Jest) related configuration.][babelConfig] | `boolean`\|`string`\|`object` | _disabled_ |
| [**`stringifyContentPathRegex`**][stringifyContentPathRegex] | [Files which will become modules returning self content.][stringifyContentPathRegex] | `string`\|`RegExp` | _disabled_ |
| [**`useESM`**][useESM] | [Enable ESM support][useESM] | `boolean` | _auto_ |

[compiler]: options/compiler
[tsconfig]: options/tsconfig
[isolatedModules]: options/isolatedModules
[astTransformers]: options/astTransformers
[compilerHost]: options/compilerHost
[diagnostics]: options/diagnostics
[babelConfig]: options/babelConfig
[stringifyContentPathRegex]: options/stringifyContentPathRegex
[useESM]: options/useESM
