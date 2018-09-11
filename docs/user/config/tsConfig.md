---
title: TypeScript Config option
---

The `tsConfig` option allows you to define the which `tsconfig` JSON file to use. An inline compiler options object can also be specified instead of the path to a file.

By default, it'll use the default TypeScript and use the project's `tsconfig.json` file. If it cannot find one, it'll use defaults TypeScript compiler options (except `es5` is used as target instead of `es3`).

If you need to use defaults and force ts-jest to use the defaults even if there is a `tsconfig.json` in your project, you can set this option to `false`.

### Examples

#### Path to a `tsconfig` file:

The path should be relative to the current working directory where you start Jest from. You can also use `<rootDir>` in the path to start from the project root dir.

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json'
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
        "tsConfig": "tsconfig.test.json"
      }
    }
  }
}
```

</div></div>

#### Inline compiler options:

Refer to the [TypeScript compiler options](https://www.typescriptlang.org/docs/handbook/compiler-options.html) to know what can be used.
It's basically the same object you'd put in your `tsconfig.json`'s `compilerOptions`.

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      tsConfig: {
        importHelpers: true
      }
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
        "tsConfig": {
          "importHelpers": true
        }
      }
    }
  }
}
```

</div></div>

#### Disable auto-lookup:

By default ts-jest will try to find the `tsconfig.json` in your project. But you may want to not use it at all and keep TypeScript default options. You can achieve this by setting `tsConfig` to `false`.

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      tsConfig: false
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
        "tsConfig": false
      }
    }
  }
}
```

</div></div>
