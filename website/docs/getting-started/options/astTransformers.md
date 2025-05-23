---
title: AST transformers option
---

`ts-jest` by default does hoisting for a few `jest` methods via a TypeScript AST transformer. One can also create custom
TypeScript AST transformers and provide them to `ts-jest` to include into compilation process.

The option is `astTransformers` and it allows ones to specify which 3 types of TypeScript AST transformers to use with `ts-jest`:

- `before` means your transformers get run before TS ones, which means your transformers will get raw TS syntax
  instead of transpiled syntax (e.g `import` instead of `require` or `define` ).
- `after` means your transformers get run after TS ones, which gets transpiled syntax.
- `afterDeclarations` means your transformers get run during `d.ts` generation phase, allowing you to transform output type declarations.

### Examples

#### Basic Transformers

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
        astTransformers: {
          before: ['my-custom-transformer'],
        },
      },
    ],
  },
}

export default jestConfig
```

#### Configuring transformers with options

:::important

The `options` config option will be serialized by [`jest-worker`](https://github.com/jestjs/jest/tree/main/packages/jest-worker) therefore only **SERIALIZABLE** values are allowed.

:::

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
        astTransformers: {
          before: [
            {
              path: 'my-custom-transformer-that-needs-extra-opts',
              options: {}, // extra options to pass to transformers here
            },
          ],
        },
      },
    ],
  },
}

export default jestConfig
```

### Writing custom TypeScript AST transformers

To write a custom TypeScript AST transformers, one can take a look at [the one](https://github.com/kulshekhar/ts-jest/tree/main/src/transformers) that `ts-jest` is using.
