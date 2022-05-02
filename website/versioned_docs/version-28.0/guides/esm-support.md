---
id: esm-support
title: ESM Support
---

To use `ts-jest` with ESM support:

- Check [ESM Jest documentation](https://jestjs.io/docs/en/ecmascript-modules).
- Enable [useESM](../getting-started/options/useESM) `true` for `ts-jest` config.
- Include `*.ts` in [extensionsToTreatAsEsm](https://jestjs.io/docs/en/next/configuration#extensionstotreatasesm-arraystring) Jest config option.
- Ensure that `tsconfig` has `module` with value for ESM, e.g. `ES2015` or `ES2020` etc...

### ESM presets

There are also [3 presets](../getting-started/presets.md) to work with ESM.

### Examples

#### Manual configuration

```js
// jest.config.js
module.exports = {
  // [...]
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
```

```json
// OR package.json
{
  // [...]
  "jest": {
    "extensionsToTreatAsEsm": [".ts"],
    "globals": {
      "ts-jest": {
        "useESM": true
      }
    },
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    }
  }
}
```

#### Use ESM presets

:::important

Starting from **v28.0.0**, `ts-jest` will gradually switch to `esbuild`/`swc` to transform `ts` to `js`. To make the transition smoothly, we introduce `legacy` presets as a fallback when the new codes don't work yet.

:::

```js
// jest.config.js
module.exports = {
  // [...]
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
```

```json
// OR package.json
{
  // [...]
  "jest": {
    "preset": "ts-jest/presets/default-esm", // or other ESM presets,
    "globals": {
      "ts-jest": {
        "useESM": true
      }
    },
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    }
  }
}
```
