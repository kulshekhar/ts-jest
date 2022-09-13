---
title: useESM option
---

The `useESM` option allows `ts-jest` to transform codes to ESM syntax **if possible**.

The default value is **false**, `ts-jest` will transform codes to `CommonJS` syntax.

### Examples

```js tab
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    '<regex_match_files': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
}
```

```ts tab
import type { JestConfigWithTsJest } from './types'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    '<regex_match_files': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
}

export default jestConfig
```

```JSON tab
{
  // [...]
  "jest": {
    "transform": {
      "<regex_match_files>": [
        "ts-jest",
        {
          "useESM": true
        }
      ]
    }
  }
}
```
