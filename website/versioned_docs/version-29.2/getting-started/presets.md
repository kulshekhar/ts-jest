---
id: presets
title: Presets
---

### The presets

:::important

Starting from **v28.0.0**, `ts-jest` will gradually opt in adoption of `esbuild`/`swc` more to improve the performance. To make the transition smoothly, we introduce `legacy` presets as a fallback when the new codes don't work yet.

:::

:::caution

The list of `preset` below is now deprecated in favor of util functions. If one is using `preset` in Jest config, please run `npx ts-jest config:migrate` or look into [Advanced](#advanced) section below for alternative solutions.

:::

`ts-jest` comes with several presets, covering most of the project's base configuration:

| Preset name                                                           | Description                                                                                                                                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts-jest/presets/default`<br/>or `ts-jest`                            | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                            |
| `ts-jest/presets/default-legacy`<br/>or `ts-jest/legacy` (**LEGACY**) | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                            |
| `ts-jest/presets/default-esm`<br/>                                    | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                                 |
| `ts-jest/presets/default-esm-legacy`<br/> (**LEGACY**)                | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                                 |
| `ts-jest/presets/js-with-ts`                                          | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`) will be transformed by `ts-jest` to **CommonJS** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file.    |
| `ts-jest/presets/js-with-ts-legacy` (**LEGACY**)                      | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`) will be transformed by `ts-jest` to **CommonJS** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file.    |
| `ts-jest/presets/js-with-ts-esm`                                      | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`) will be transformed by `ts-jest` to **ESM** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file. |
| `ts-jest/presets/js-with-ts-esm-legacy` (**LEGACY**)                  | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`) will be transformed by `ts-jest` to **ESM** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file. |
| `ts-jest/presets/js-with-babel`                                       | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, and JavaScript files (`.js`, `jsx`) will be transformed by `babel-jest`.                                  |
| `ts-jest/presets/js-with-babel-legacy` (**LEGACY**)                   | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, and JavaScript files (`.js`, `jsx`) will be transformed by `babel-jest`.                                  |
| `ts-jest/presets/js-with-babel-esm`                                   | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, and JavaScript files (`.js`, `jsx`, `.mjs`) will be transformed by `babel-jest`.                               |
| `ts-jest/presets/js-with-babel-esm-legacy` (**LEGACY**)               | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, and JavaScript files (`.js`, `jsx`, `.mjs`) will be transformed by `babel-jest`.                               |

### Basic usage

In most cases, simply setting the `preset` key to the desired preset name in your Jest config should be enough to start
using TypeScript with Jest (assuming you added `ts-jest` to your `devDependencies` of course):

```js tab
// jest.config.js
const { createDefaultPreset } = require('ts-jest')

const defaultPreset = createDefaultPreset()

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  // Replace `ts-jest` with the preset you want to use
  // from the above list
  ...defaultPreset,
}
```

```ts tab
// jest.config.ts
import { type JestConfigWithTsJest, createDefaultPreset } from 'ts-jest'

const defaultPreset = createDefaultPreset()

const jestConfig: JestConfigWithTsJest = {
  // [...]
  // Replace `ts-jest` with the preset you want to use
  // from the above list
  ...defaultPreset,
}

export default jestConfig
```

**Note:** presets use `testMatch`, like Jest does in its defaults. If you want to use `testRegex` instead in your configuration, you MUST set `testMatch` to `null` or Jest will bail.

### Advanced

There are several util functions to create and extend the existing presets:

- `createDefaultPreset`: for default preset
- `createDefaultLegacyPreset`: for default preset in legacy mode
- `createDefaultEsmPreset`: for default ESM preset
- `createDefaultEsmLegacyPreset`: for default ESM preset in legacy mode
- `createJsWithTsPreset`: for `js-with-ts` preset
- `createJsWithTsLegacyPreset`: for `js-with-ts` preset in legacy mode
- `createJsWithTsEsmPreset`: for `js-with-ts` ESM preset
- `createJsWithTsEsmLegacyPreset`: for `js-with-ts` ESM preset in legacy mode
- `createJsWithBabelPreset`: for `js-with-babel` preset
- `createJsWithBabelLegacyPreset`: for `js-with-babel` preset in legacy mode
- `createJsWithBabelEsmPreset`: for `js-with-babel` ESM preset
- `createJsWithBabelEsmLegacyPreset`: for `js-with-babel` ESM preset in legacy mode

Example:

```js tab
// jest.config.js
const { createDefaultPreset } = require('ts-jest')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    ...createDefaultPreset().transform,
    // [...]
  },
}
```

```ts tab
// jest.config.ts
import { createDefaultPreset, type JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    ...createDefaultPreset().transform,
    // [...]
  },
}

export default jestConfig
```
