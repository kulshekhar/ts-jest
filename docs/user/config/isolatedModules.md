---
title: Isolated Modules option
---

By default TSJest uses TypeScript compiler in the context of a project (yours), with full type-checking and features. But it can also be used to compile each file separately, as an isolated module. That's what the `isolatedModules` option (which defaults to `false`) comes for.

You'll loose type-checking ability and some features such as `const enum`, but in the case you plan on using Jest with the cache disabled (`jest --no-cache`), your tests will then run much faster.

Here is how to disable type-checking and compile each file as an isolated module:

### Example:

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
        "isolatedModules": false
      }
    }
  }
}
```

</div></div>
