---
title: Isolated Modules option
---

By default `ts-jest` uses TypeScript compiler in the context of a project (yours), with full type-checking and features.
But it can also be used to compile each file separately, what TypeScript calls an 'isolated module'.
That's what the `isolatedModules` option (which defaults to `false`) does.

You'll lose type-checking ability and some features such as `const enum`, but in the case you plan on using Jest with the cache disabled (`jest --no-cache`), your tests will then run much faster.

Here is how to disable type-checking and compile each file as an isolated module:

### Example

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      isolatedModules: true,
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
        "isolatedModules": true
      }
    }
  }
}
```

## Performance

Using `isolatedModules: false` comes with a cost of performance comparing to `isolatedModules: true`. There is a way
to improve the performance when using this mode by changing the value of `include` in `tsconfig` which is used by `ts-jest`.
The least amount of files which are provided in `include`, the more performance the test run can gain.

### Example

```json
// tsconfig.json
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
