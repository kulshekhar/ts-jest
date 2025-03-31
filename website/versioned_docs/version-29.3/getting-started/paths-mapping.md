---
id: paths-mapping
title: Paths mapping
---

If you use ["baseUrl" and "paths" options](https://www.typescriptlang.org/docs/handbook/module-resolution.html) in your `tsconfig` file, you should make sure the ["moduleNameMapper"](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring) option in your Jest config is setup accordingly.

`ts-jest` provides a helper to transform the mapping from `tsconfig` to Jest config format, but it needs the `.js` version of the config file.

### Example

#### TypeScript config

With the below config in your `tsconfig`:

```json title="tsconfig.json"
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

```ts title="jest.config.ts"
import type { Config } from 'jest'

const jestConfig: Config = {
  // [...]
  moduleNameMapper: {
    '^@App/(.*)$': '<rootDir>/src/$1',
    '^lib/(.*)$': '<rootDir>/common/$1',
  },
}

export default jestConfig
```

#### Jest config (with helper)

```ts title="jest.config.ts"
import { pathsToModuleNameMapper } from 'ts-jest'
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
import { compilerOptions } from './tsconfig'
import type { Config } from 'jest'

const jestConfig: Config = {
  // [...]
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */),
}

export default jestConfig
```

With extra options as 2nd argument:

- `prefix`: append prefix to each of mapped config in the result
- `useESM`: when using `type: module` in `package.json`, TypeScript enforces users to have explicit `js` extension when importing
  a `ts` file. This option is to help `pathsToModuleNameMapper` to create a config to suit with this scenario.

#### If using `globalSetup` or `globalTeardown`

Files used for [`globalSetup`](https://jestjs.io/docs/configuration#globalsetup-string) or [`globalTeardown`](https://jestjs.io/docs/configuration#globalteardown-string) are not directly processes by `jest`, so those do not use the ["moduleNameMapper"](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring) mapping. So you have to make sure those are able to map the paths themselves.

##### Global setup file with `tsconfig-paths`

For those files to be able to use [`tsconfig-paths`](https://www.npmjs.com/package/tsconfig-paths), you have to import it directly

```ts title="global-setup.ts"
import 'tsconfig-paths/register'

/**
 * Your global setup
 */

// ./path/to/globalTeardown.ts
import 'tsconfig-paths/register'

/**
 * Your global teardown
 */
```
