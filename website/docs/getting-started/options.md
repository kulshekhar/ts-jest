---
id: options
title: Options
---

### Introduction

All `ts-jest` specific options can be defined in Jest `transform` config object in the `package.json` file of your project,
or through a `jest.config.js`, or `jest.config.ts` file.

```json
// package.json
{
  // [...]
  "jest": {
    "transform": {
      "<regex_match_files>": [
        "ts-jest",
        {
          // ts-jest configuration goes here
        }
      ]
    }
  }
}
```

Or through JavaScript:

```js
// jest.config.js
module.exports = {
  // [...]
  transform: {
    '<regex_match_files>': [
      'ts-jest',
      {
        // ts-jest configuration goes here
      },
    ],
  },
}
```

:::tip

To utilize IDE suggestions, you can use `JSDoc` comments to provide suggested `ts-jest` configs for your Jest config:

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = config = {
  // [...]
  transform: {
    '<regex_match_files>': [
      'ts-jest',
      {
        // ts-jest configuration goes here and your IDE will suggest which configs when typing
      },
    ],
  },
}
```

:::

Or through TypeScript (if `ts-node` is installed):

```ts
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  transform: {
    '<regex_match_files>': [
      'ts-jest',
      {
        // ts-jest configuration goes here
      },
    ],
  },
}
export default config
```

:::important

When using TypeScript Jest config file, Jest will use `ts-node` to compile the config file. `ts-jest` doesn't take part in
that process.

:::

### Options

All options have default values which should fit most of the projects. Click on the option's name to see details and example(s).

| Option                                                       | Description                                                                          | Type                          | Default        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------- | -------------- |
| [**`compiler`**][compiler]                                   | [TypeScript module to use as compiler.][compiler]                                    | `string`                      | `"typescript"` |
| [**`tsconfig`**][tsconfig]                                   | [TypeScript compiler related configuration.][tsconfig]                               | `string`\|`object`\|`boolean` | _auto_         |
| [**`isolatedModules`**][isolatedmodules]                     | [Disable type-checking][isolatedmodules]                                             | `boolean`                     | _disabled_     |
| [**`astTransformers`**][asttransformers]                     | [Custom TypeScript AST transformers][asttransformers]                                | `object`                      | _auto_         |
| [**`diagnostics`**][diagnostics]                             | [Diagnostics related configuration.][diagnostics]                                    | `boolean`\|`object`           | _enabled_      |
| [**`babelConfig`**][babelconfig]                             | [Babel(Jest) related configuration.][babelconfig]                                    | `boolean`\|`string`\|`object` | _disabled_     |
| [**`stringifyContentPathRegex`**][stringifycontentpathregex] | [Files which will become modules returning self content.][stringifycontentpathregex] | `string`\|`RegExp`            | _disabled_     |
| [**`useESM`**][useesm]                                       | [Enable ESM support][useesm]                                                         | `boolean`                     | _auto_         |

[compiler]: options/compiler
[tsconfig]: options/tsconfig
[isolatedmodules]: options/isolatedModules
[asttransformers]: options/astTransformers
[diagnostics]: options/diagnostics
[babelconfig]: options/babelConfig
[stringifycontentpathregex]: options/stringifyContentPathRegex
[useesm]: options/useESM
