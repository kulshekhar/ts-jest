---
id: presets
title: Presets
---

### The presets

`ts-jest` comes with several presets, covering most of the project's base configuration:

| Preset name                                | Description                                                                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts-jest/presets/default`<br/>or `ts-jest` | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                            |
| `ts-jest/presets/default-esm`<br/>         | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                                 |
| `ts-jest/presets/js-with-ts`               | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`) will be transformed by `ts-jest` to **CommonJS** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file.    |
| `ts-jest/presets/js-with-ts-esm`           | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`) will be transformed by `ts-jest` to **ESM** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file. |
| `ts-jest/presets/js-with-babel`            | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, and JavaScript files (`.js`, `jsx`) will be transformed by `babel-jest`.                                  |
| `ts-jest/presets/js-with-babel-esm`        | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, and JavaScript files (`.js`, `jsx`, `.mjs`) will be transformed by `babel-jest`.                               |

### Basic usage

In most cases, simply setting the `preset` key to the desired preset name in your Jest config should be enough to start
using TypeScript with Jest (assuming you added `ts-jest` to your `devDependencies` of course):

```js
// jest.config.js
module.exports = {
  // [...]
  // Replace `ts-jest` with the preset you want to use
  // from the above list
  preset: 'ts-jest',
}
```

```json
// OR package.json
{
  // [...]
  "jest": {
    // Replace `ts-jest` with the preset you want to use
    // from the above list
    "preset": "ts-jest"
  }
}
```

**Note:** presets use `testMatch`, like Jest does in its defaults. If you want to use `testRegex` instead in your configuration, you MUST set `testMatch` to `null` or Jest will bail.

### Advanced

Any preset can also be used with other options.
If you're already using another preset, you might want only some specific settings from the chosen `ts-jest` preset.
In this case you'll need to use the JavaScript version of Jest config (comment/uncomment according to your use case):

```js
// jest.config.js
const { defaults: tsjPreset } = require('ts-jest/presets')
// const { defaultsESM: tsjPreset } = require('ts-jest/presets')
// const { jsWithTs: tsjPreset } = require('ts-jest/presets')
// const { jsWithTsESM: tsjPreset } = require('ts-jest/presets')
// const { jsWithBabel: tsjPreset } = require('ts-jest/presets')
// const { jsWithBabelESM: tsjPreset } = require('ts-jest/presets')

module.exports = {
  // [...]
  transform: {
    ...tsjPreset.transform,
    // [...]
  },
}
```

Or through TypeScript (if `ts-node` is installed):

```ts
// jest.config.ts
import type { InitialOptionsTsJest } from 'ts-jest/dist/types'
import { defaults as tsjPreset } from 'ts-jest/presets'
// import { defaultsESM as tsjPreset } from 'ts-jest/presets'
// import { jsWithTs as tsjPreset } from 'ts-jest/presets'
// import { jsWithTsESM as tsjPreset } from 'ts-jest/presets'
// import { jsWithBabel as tsjPreset } from 'ts-jest/presets'
// import { jsWithBabelESM as tsjPreset } from 'ts-jest/presets'

const config: InitialOptionsTsJest = {
  // [...]
  transform: {
    ...tsjPreset.transform,
    // [...]
  },
}

export default config
```
