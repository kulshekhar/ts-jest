---
title: transpilation option
---

By default `ts-jest` uses TypeScript Compiler API aka full `Program` in the context of a project (yours), with full type-checking and features.
But it can also be used to compile each file separately, which is usually named as `transpilation` like other tools `Babel`, `swc`, `esbuild` etc.
That's what the `transpilation` option (which defaults to `false`) does.

You'll lose type-checking ability and all [TypeScript limitations](https://www.typescriptlang.org/tsconfig/#isolatedModules) are applied in trading off for faster test running.

Here is the example how to use the option

### Example

```ts title="jest.config.ts"
import type { Config } from 'jest'

const jestConfig: Config = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        transpilation: true,
      },
    ],
  },
}

export default jestConfig
```

## Performance

Using `transpilation: false` comes with a cost of performance comparing to `transpilation: true`. There is a way
to improve the performance when using this mode by changing the value of `include` in `tsconfig` which is used by `ts-jest`.
The least amount of files which are provided in `include`, the more performance the test run can gain.

### Example

```json title="tsconfig.json"
{
  // ...other configs
  "include": ["my-typings/*", "my-global-modules/*"]
}
```

## Caveats

Limiting the amount of files loaded via `include` can greatly boost performance when running tests. However, the trade off
is `ts-jest` might not recognize all files which are intended to use with `jest`. One can run into issues with custom typings,
global modules, etc...

The suggested solution is what is needed for the test environment should be captured by
glob patterns in `include`, to gain both performance boost and avoid breaking behaviors.
