---
id: paths-mapping
title: Paths mapping
---

If you use ["baseUrl" and "paths" options](https://www.typescriptlang.org/docs/handbook/module-resolution.html) in your `tsconfig` file, you should make sure the ["moduleNameMapper"](https://facebook.github.io/jest/docs/en/configuration.html#modulenamemapper-object-string-string) option in your Jest config is setup accordingly.

`ts-jest` provides a helper to transform the mapping from `tsconfig` to Jest config format, but it needs the `.js` version of the config file.

### Example

#### TypeScript config

With the below config in your `tsconfig`:

```js
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@App/*": ["src/*"],
      "lib/*": ["common/*"]
    }
  }
}
```

#### Jest config (without helper)

```js
// jest.config.js
module.exports = {
  // [...]
  moduleNameMapper: {
    '^@App/(.*)$': '<rootDir>/src/$1',
    '^lib/(.*)$': '<rootDir>/common/$1'
  }
};
```

```js
// OR package.json
{
  // [...]
  "jest": {
    "moduleNameMapper": {
      "^@App/(.*)$": "<rootDir>/src/$1",
      "^lib/(.*)$": "<rootDir>/common/$1"
    }
  }
}
```

#### Jest config (with helper)

```js
// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest/utils');
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require('./tsconfig');

module.exports = {
  // [...]
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */ )
};
```
