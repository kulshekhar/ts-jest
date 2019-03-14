---
title: packageJson Config option
---

The `packageJson` option specifies the `package.json` file to use. An inline object may also be specified instead of a file path.

By default, the `package.json` file at the root of the project will be used. If it cannot be found, an empty project definition will be used instead.

### Examples

#### Path to a `packageJson` file

The path should be relative to the current working directory where you start Jest from. You can also use `<rootDir>` in the path to start from the project root dir.

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      packageJson: 'package.json'
    }
  }
};
```

</div><div class="col-md-6" markdown="block">

```js
// OR from a non-trivial path
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      packageJson: '<rootDir>/../../shared/package.json'
    }
  }
};
```

</div></div>

#### Inline package metadata

<div class="row"><div class="col-md-12" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      packageJson: {
          "name": "my-project",
          "version": "1.0.0",
          "dependencies": {
            // [...]
          }
      }
    }
  }
};
```

</div></div>

