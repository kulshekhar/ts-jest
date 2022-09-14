---
title: Compiler option
---

The `compiler` option allows you to define the compiler to be used. It'll be used to load the NodeJS module holding the TypeScript compiler.

The default value is `typescript`, which will load the original [TypeScript compiler module](https://www.npmjs.com/package/typescript).
The loaded version will depend on the one installed in your project.

If you use a custom compiler, such as `ttypescript`, make sure its API is the same as the original TypeScript, at least for what `ts-jest` is using.

### Example

```js tab
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    '<regex_match_files': [
      'ts-jest',
      {
        compiler: 'ttypescript',
      },
    ],
  },
}
```

```ts tab
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    '<regex_match_files': [
      'ts-jest',
      {
        compiler: 'ttypescript',
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
          "compiler": "ttypescript"
        }
      ]
    }
  }
}
```
