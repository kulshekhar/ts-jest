---
title: ESM Support
---

To use `ts-jest` with ESM support, you'll first need to check [ESM Jest documentation](https://jestjs.io/docs/en/ecmascript-modules).

`ts-jest` supports ESM via a config option [useESM](options/useESM.md) in combination with jest config option [extensionsToTreatAsEsm](https://jestjs.io/docs/en/next/configuration#extensionstotreatasesm-arraystring).

There are also [3 presets](presets.md) to work with ESM.

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
    }
  }
}
```

#### Use ESM presets

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
    }
  }
}
```
