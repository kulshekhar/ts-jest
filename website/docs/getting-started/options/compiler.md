---
title: Compiler option
---

The `compiler` option allows you to define the compiler to be used. It'll be used to load the NodeJS module holding the TypeScript compiler.

The default value is `typescript`, which will load the original [TypeScript compiler module](https://www.npmjs.com/package/typescript).
The loaded version will depend on the one installed in your project.

If you use a custom compiler, such as `ttypescript`, make sure its API is the same as the original TypeScript, at least for what `ts-jest` is using.

### Native TypeScript 7+

Native TypeScript (7.0 and later) no longer ships the in-process JS compiler API that `ts-jest` uses for emit and
AST transforms. When the project's `typescript` package is native TypeScript, `ts-jest` automatically resolves its
compiler API in this order:

1. an explicit `compiler` option (used strictly — a module without the JS API is an error),
2. the project's `typescript` package, when it still exposes the JS API (TypeScript 6.x and earlier),
3. the official [`@typescript/typescript6`](https://www.npmjs.com/package/@typescript/typescript6) compatibility
   package, published by the TypeScript team to be installed alongside native TypeScript.

In a TypeScript 7+ project, install the compatibility package next to it and `ts-jest` picks it up automatically:

```sh
npm install --save-dev @typescript/typescript6
```

Type-checking can additionally use the fast native compiler itself via the experimental
[`diagnostics: { engine: 'native' }`](./diagnostics) option.

### Example

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
        compiler: 'ttypescript',
      },
    ],
  },
}

export default jestConfig
```
