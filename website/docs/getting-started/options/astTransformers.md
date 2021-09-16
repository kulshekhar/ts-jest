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

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      astTransformers: {
        before: ['my-custom-transformer'],
      },
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
        "astTransformers": {
          "before": ["my-custom-transformer"]
        }
      }
    }
  }
}
```

#### Configuring transformers with options

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      astTransformers: {
        before: [
          {
            path: 'my-custom-transformer-that-needs-extra-opts',
            options: {}, // extra options to pass to transformers here
          },
        ],
      },
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
        "astTransformers": {
          "before": [
            {
              "path": "my-custom-transformer-that-needs-extra-opts",
              "options": {} // extra options to pass to transformers here
            }
          ]
        }
      }
    }
  }
}
```

### Public transformers

`ts-jest` is able to expose transformers for public usage to provide the possibility to opt-in/out for users. Currently
the exposed transformers are:

- `path-mapping` convert alias import/export to relative import/export path base on `paths` in `tsconfig`.
  This transformer works similar to `moduleNameMapper` in `jest.config.js`. When using this transformer, one might not need
  `moduleNameMapper` anymore.

#### Example of opt-in transformers

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      astTransformers: {
        before: ['ts-jest/dist/transformers/path-mapping'],
      },
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
        "astTransformers": {
          "before": ["ts-jest/dist/transformers/path-mapping"]
        }
      }
    }
  }
}
```

### Writing custom TypeScript AST transformers

To write a custom TypeScript AST transformers, one can take a look at [the one](https://github.com/kulshekhar/ts-jest/tree/main/src/transformers) that `ts-jest` is using.
