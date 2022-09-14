---
id: paths-mapping
title: Paths mapping
---

If you use ["baseUrl" and "paths" options](https://www.typescriptlang.org/docs/handbook/module-resolution.html) in your `tsconfig` file, you should make sure the ["moduleNameMapper"](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring) option in your Jest config is setup accordingly.

`ts-jest` provides a helper to transform the mapping from `tsconfig` to Jest config format, but it needs the `.js` version of the config file.

### Example

#### TypeScript config

With the below config in your `tsconfig`:

```json
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

```js tab
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  moduleNameMapper: {
    '^@App/(.*)$': '<rootDir>/src/$1',
    '^lib/(.*)$': '<rootDir>/common/$1',
  },
}
```

```ts tab
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: {
    '^@App/(.*)$': '<rootDir>/src/$1',
    '^lib/(.*)$': '<rootDir>/common/$1',
  },
}

export default jestConfig
```

```JSON tab
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

```js tab
const { pathsToModuleNameMapper } = require('ts-jest')
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require('./tsconfig')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */),
}
```

```ts tab
import { pathsToModuleNameMapper } from 'ts-jest'
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
import { compilerOptions } from './tsconfig'
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */),
}

export default jestConfig
```
