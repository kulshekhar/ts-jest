---
id: troubleshooting
title: Troubleshooting
---

During your development with ts-jest, you may encounter various issues. Use this guide to resolve them.

Please also check Jest [troubleshooting guide](https://jestjs.io/docs/en/troubleshooting) if your issue is related to jest.

## Running ts-jest on CI tools

### PROBLEM

Cannot find module "" from ""

### SOLUTION

- Check if `rootDir` is referenced correctly. If not add this on your existing jest configuration.

```ts title="jest.config.ts"
import type { Config } from 'jest'

const config: Config = {
  //...
  roots: ['<rootDir>'],
}

export default config
```

- Check if module directories are included on your jest configuration. If not add this on your existing jest configuration.

```ts title="jest.config.ts"
import type { Config } from 'jest'

const config: Config = {
  //...
  moduleDirectories: ['node_modules', '<module-directory>'],
  modulePaths: ['<path-of-module>'],
}

export default config
```

- Check if module name is properly mapped and can be referenced by jest. If not, you can define moduleNameMapper for your jest configuration.

```ts title="jest.config.ts"
import type { Config } from 'jest'

const config: Config = {
  //...
  moduleNameMapper: {
    '<import-path>': '<rootDir>/<real-physical-path>',
  },
}

export default config
```

- Check github folder names if its identical to you local folder names. Sometimes github never updates your folder names even if you rename it locally. If this happens rename your folders via github or use this command `git mv <source> <destination>` and commit changes.

## Transform node_module packages

### PROBLEM

A package inside node_modules throws one of the following errors:

```shell
SyntaxError: Cannot use import statement outside a module
```

or

```shell
SyntaxError: Unexpected token 'export'
```

### SOLUTION

One of the node modules doesn't have the correct syntax for Jest's execution step. It needs to be transformed first.

The error message usually shows which module is affected:

```shell
    SyntaxError: Cannot use import statement outside a module
    > 22 | import Component from "../../node_modules/some-module/lib";
         | ^
```

> [!TIP]
> Use the `nodeModulesTransformPattern` helper from `ts-jest` to generate the correct `transformIgnorePatterns` entry instead of writing the regex manually.

> [!CAUTION]
> You should only have one entry in `transformIgnorePatterns` for `node_modules`.

#### If the offending files are `.mjs` files

Use when individual files have a `.mjs` extension. Pass `mjsPackages: true` — ts-jest will transpile all `.mjs` files in `node_modules` to CommonJS without needing to list packages individually.

Removing mjs packages from ignore patterns alone isn't enough. You must also ask the transformer to look for mjs files:

```ts title="jest.config.ts"
import type { Config } from 'jest'
import { createDefaultPreset, MJS_NODE_MODULES_TRANSFORM, nodeModulesTransformPattern } from 'ts-jest'

const presetConfig = createDefaultPreset()

const config: Config = {
  ...presetConfig,
  transformIgnorePatterns: [nodeModulesTransformPattern({ mjsPackages: true })],
  transform: {
    ...presetConfig.transform,
    [MJS_NODE_MODULES_TRANSFORM]: ['ts-jest', {}],
  },
}

export default config
```

#### If the offending package uses `"type": "module"` in its `package.json`

Use when a package declares `"type": "module"`, causing its `.js` files to be treated as ESM. Pass `typeModulePackages: true` to automatically detect all such packages:

```ts title="jest.config.ts"
import type { Config } from 'jest'
import { nodeModulesTransformPattern } from 'ts-jest'

const config: Config = {
  //...
  // auto-detect all packages with "type": "module"
  transformIgnorePatterns: [nodeModulesTransformPattern({ typeModulePackages: true })],
}

export default config
```

#### Manual resolution

If you need to specify packages manually, you can use the helper function.

```ts title="jest.config.ts"
transformIgnorePatterns: [nodeModulesTransformPattern({ packageNames: ['package-x', 'package-y'] })]
```

For more information see [here](https://stackoverflow.com/questions/63389757/jest-unit-test-syntaxerror-cannot-use-import-statement-outside-a-module) and [here](https://stackoverflow.com/questions/52035066/how-to-write-jest-transformignorepatterns).

## Tests gets stuck when importing a dependency

### PROBLEM

Without cache, jest takes an extremely long time to process files and appears to be stuck.

### SOLUTION

`ts-jest` internally uses TypeScript compiler API to transform ts/js file into js file. The recommendation is to only transform what is needed.

A possible cause for that issue is that you may have enabled `ts-jest` to process javascript files in addition to TypeScript files. This leads to the result that more files are loaded which can, in some cases, blow up the machine.

- In your tsconfig file, check if `compilerOptions.allowJs` is unset or set to false.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "allowJs": false
  }
}
```

- In your jest configuration, check if the transform property includes only `.ts` files for ts-jest. If not, change the regular expression to exclude js files. You can also enable `isolatedModules: true` in tsconfig for `ts-jest` to use transpilation mode (similarly to other transpilers like `Babel`/`SWC`/`Esbuild`) for tests.

```diff
module.exports = {
  ...
  'transform': {
-    '^.+\\.(t|j)s$': ['ts-jest', {}],
+    '^.+\\.ts$': 'ts-jest',
  },
};
```

For more information see [here](https://github.com/kulshekhar/ts-jest/issues/4294)
