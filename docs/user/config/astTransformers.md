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

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      astTransformers: {
        before: ['my-custom-transformer'],
      },
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
        astTransformers: {
          "before": ["my-custom-transformer"]
        }
      }
    }
  }
}
```

</div></div>

### Writing custom TypeScript AST transformers

To write a custom TypeScript AST transformers, one can take a look at [the one](https://github.com/kulshekhar/ts-jest/tree/master/src/transformers) that `ts-jest` is using.
