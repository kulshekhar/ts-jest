---
title: useESM option
---

The `useESM` option allows `ts-jest` to transform codes to ESM syntax **if possible**.

The default value is **false**, `ts-jest` will transform codes to `CommonJS` syntax.

:::tip

See more about ESM support in [dedicated guide](../../guides/esm-support.md)

:::

### Examples

```ts title="jest.config.ts"
import type { Config } from 'jest'

const jestConfig: Config = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
}

export default jestConfig
```
