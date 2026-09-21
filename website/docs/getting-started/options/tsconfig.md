---
title: TypeScript Config option
---

The `tsconfig` option controls which TypeScript configuration `ts-jest` uses. An inline [compiler options][] object can also be specified instead of a file path.

When `tsconfig` is omitted (or set to `true`), `ts-jest` discovers the nearest `tsconfig.json` starting at Jest's `rootDir` (`cwd` when `rootDir` is not set). If it cannot find one, it uses the default TypeScript [compiler options][]; except, `ES2015` is used as `target` instead of `ES5`.

Set `tsconfig` to `false` to disable file discovery and use ts-jest/TypeScript defaults. An inline object is standalone: it uses only the supplied compiler options and does not discover or merge another `tsconfig.json`. An empty object therefore uses defaults without file discovery.

Paths are loaded exactly as specified. Relative paths are resolved from the Jest `cwd`; `<rootDir>` resolves from Jest's `rootDir`. TypeScript still processes an `extends` chain declared by the selected file.

`ts-jest` must receive JavaScript from TypeScript's compiler API. Configurations with `noEmit: true` or `emitDeclarationOnly: true` fail with an actionable error. To keep in-memory transformation deterministic, `ts-jest` also disables declaration output and disk-oriented output settings (`declaration`, `declarationMap`, `isolatedDeclarations`, `inlineSourceMap`, `out`, `outFile`, `composite`, `declarationDir`, `emitDeclarationOnly`, `sourceRoot`, and `tsBuildInfoFile`) and keeps `removeComments` disabled.

### Examples

#### Path to a `tsconfig` file

The path should be relative to the current working directory where you start Jest from. You can also use `<rootDir>` in the path to start from the project root dir.

```ts title="jest.config.ts"
import type { Config } from 'jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
}

export default jestConfig
```

#### Inline compiler options

Refer to the TypeScript [compiler options][] for reference.
It's the same shape as the `compilerOptions` object in `tsconfig.json`, and is used as a standalone configuration.

```ts title="jest.config.ts"
import type { Config } from 'jest'

const jestConfig: Config = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          importHelpers: true,
        },
      },
    ],
  },
}

export default jestConfig
```

#### Disable auto-lookup

You may not want to use a `tsconfig.json` at all and keep TypeScript default options. You can achieve this by setting `tsconfig` to `false`.

```ts title="jest.config.ts"
import type { Config } from 'jest'

const jestConfig: Config = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: false,
      },
    ],
  },
}

export default jestConfig
```

[compiler options]: https://www.typescriptlang.org/tsconfig
