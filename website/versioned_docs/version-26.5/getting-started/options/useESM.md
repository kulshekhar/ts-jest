---
title: useESM option
---

The `useESM` option allows `ts-jest` to transform codes to ESM syntax **if possible**.

The default value is **false**, `ts-jest` will transform codes to `CommonJS` syntax.

### Examples

```js
// jest.config.js
module.exports = {
  // [...]
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
    "globals": {
      "ts-jest": {
        "useESM": true
      }
    }
  }
}
```
