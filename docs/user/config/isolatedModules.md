---
title: Isolated Modules option
---

By default `ts-jest` uses TypeScript compiler in the context of a project (yours), with full type-checking and features.
But it can also be used to compile each file separately, what TypeScript calls an 'isolated module'.
That's what the `isolatedModules` option (which defaults to `false`) does.

You'll lose type-checking ability and some features such as `const enum`, but in the case you plan on using Jest with the cache disabled (`jest --no-cache`), your tests will then run much faster.

Here is how to disable type-checking and compile each file as an isolated module:

## Performance

Using `isolatedModules: false` (default) might impact the performance of your tests. To solve this, there are 2 ways:
- Either use `isolatedModules: true` (see disadvantages above)
- Or use `isolatedModules: false` and check your `tsconfig.json` which `ts-jest` uses. Make sure that your test `tsconfig` only includes the files which are needed
for your test environment. These necessary files can **ONLY** be:
    - Your global modules imported via namespaces
    - Polyfills
    - Other test environment files

When creating `LanguageService` instance, `LanguageServiceHost` takes all the files declared by the combination of `files`, 
`includes` and `excludes` which are provided via your test `tsconfig`. If `tsconfig` includes all the files in a project, 
this will make internal `TypeScript` take lots of time because `TypeScript` is busy with reading files which creates 
lots of unnecessary I/O threads before it actually creates the instance which will impact to the performance.

### Example

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
```

</div><div class="col-md-6" markdown="block">

```js
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

</div></div>
