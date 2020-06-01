---
title: AST transformers option
---

`ts-jest` by default does hoisting for a few `jest` methods via a TypeScript AST transformer. One can also create custom
TypeScript AST transformers and provide them to `ts-jest` to include into compilation process.

The option is `astTransformers` and it allows ones to specify which TypeScript AST transformers to use with `ts-jest`.

### Examples

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      astTransformers: ['my-custom-transformer'],
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
        astTransformers: ['my-custom-transformer'],
      }
    }
  }
}
```

</div></div>

### Writing custom TypeScript AST transformers

To write a custom TypeScript AST transformers, one can take a look at the one that `ts-jest` is using at
https://github.com/kulshekhar/ts-jest/tree/master/src/transformers
