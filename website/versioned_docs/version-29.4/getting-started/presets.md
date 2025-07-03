---
id: presets
title: Presets
---

In Jest, **presets** are pre-defined configurations that help streamline and standardize the process of setting up testing environments.
They allow developers to quickly configure Jest with specific transformers, file extensions, and other options.

`ts-jest` provides very opinionated presets and based on what we found to be useful.

:::important

The current best practice for using presets is to call one of the utility functions below to create (and optionally extend) presets. Legacy presets are listed at the bottom of the page.

:::

## Functions

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(1)} />

---

### `createDefaultPreset(options)`

Create a configuration to process TypeScript files (`.ts`/`.tsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type DefaultPreset = {
  transform: {
    '^.+.tsx?$': ['ts-jest', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createDefaultPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createDefaultLegacyPreset(options)`

Create a **LEGACY** configuration to process TypeScript files (`.ts`, `.tsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type DefaultPreset = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest/legacy', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createDefaultLegacyPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultPreset({
  //...optionsa
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createDefaultEsmPreset(options)`

Create an ESM configuration to process TypeScript files (`.ts`/`.mts`/`.tsx`/`.mtsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
interface TsJestTransformerOptions {
  tsconfig?: boolean | string | RawCompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type DefaultEsmPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    '^.+\\.m?tsx?$': ['ts-jest', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createDefaultLegacyEsmPreset(options)`

Create a **LEGACY** ESM configuration to process TypeScript files (`.ts`/`.mts`/`.tsx`/`.mtsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type DefaultEsmPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    '^.+\\.m?tsx?$': ['ts-jest/legacy', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createDefaultLegacyEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultLegacyEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithTsPreset(options)`

Create a configuration to process JavaScript/TypeScript files (`.js`/`.jsx`/`.ts`/`.tsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithTsPreset = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithTsPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithTsPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithTsLegacyPreset(options)`

Create a **LEGACY** configuration to process JavaScript/TypeScript files (`.js`/`.jsx`/`.ts`/`.tsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
interface TsJestTransformerOptions {
  tsconfig?: boolean | string | RawCompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithTsPreset = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest/legacy', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithTsLegacyPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithTsLegacyPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithTsEsmPreset(options)`

Create a ESM configuration to process JavaScript/TypeScript files (`.js`/`.mjs`/`.jsx`/`.mjsx`/`.ts`/`.mts`/`.tsx`/`.mtsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithTsPreset = {
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithTsEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithTsEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithTsEsmLegacyPreset(options)`

Create a **LEGACY** ESM configuration to process JavaScript/TypeScript files (`.js`/`.mjs`/`.jsx`/`.mjsx`/`.ts`/`.mts`/`.tsx`/`.mtsx`).

#### Parameters

- `options` (**OPTIONAL**)
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
interface TsJestTransformerOptions {
  tsconfig?: boolean | string | RawCompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithTsPreset = {
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest/legacy', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithTsEsmLegacyPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithTsEsmLegacyPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithBabelPreset(options)`

Create a configuration to process JavaScript/TypeScript files (`.js`/`.jsx`/`.ts`/`.tsx`) which uses `babel-jest` to perform additional transformation.

#### Parameters

- `options` (**OPTIONAL**):
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `babelConfig`: see more at [babelConfig options page](./options/babelConfig.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  babelConfig?: boolean | string | BabelConfig
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithBabelPreset = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithBabelPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithBabelPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithBabelLegacyPreset(options)`

Create a **LEGACY** configuration to process JavaScript/TypeScript files (`.js`/`.jsx`/`.ts`/`.tsx`) which uses `babel-jest` to perform additional transformation.

#### Parameters

- `options` (**OPTIONAL**):
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `babelConfig`: see more at [babelConfig options page](./options/babelConfig.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
interface TsJestTransformerOptions {
  tsconfig?: boolean | string | RawCompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  babelConfig?: boolean | string | BabelConfig
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithBabelPreset = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest/legacy', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithBabelLegacyPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithBabelLegacyPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithBabelEsmPreset(options)`

Create a ESM configuration to process JavaScript/TypeScript files (`.js`/`.mjs`/`.jsx`/`.mjsx`/`.ts`/`.mts`/`.tsx`/`.mtsx`) which uses `babel-jest` to perform additional transformation.

#### Parameters

- `options` (**OPTIONAL**):
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `babelConfig`: see more at [babelConfig options page](./options/babelConfig.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
import type { TsConfigJson } from 'type-fest'

interface TsJestTransformerOptions {
  tsconfig?: boolean | string | TsConfigJson.CompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  babelConfig?: boolean | string | BabelConfig
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithBabelPreset = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithBabelEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithBabelEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### `createJsWithBabelEsmLegacyPreset(options)`

Create a **LEGACY** ESM configuration to process JavaScript/TypeScript files (`.js`/`.mjs`/`.jsx`/`.mjsx`/`.ts`/`.mts`/`.tsx`/`.mtsx`) which uses `babel-jest` to perform additional transformation.

#### Parameters

- `options` (**OPTIONAL**):
  - `tsconfig`: see more at [tsconfig options page](./options/tsconfig.md)
  - `isolatedModules`: see more at [isolatedModules options page](./options/isolatedModules.md)
  - `compiler`: see more at [compiler options page](./options/compiler.md)
  - `astTransformers`: see more at [astTransformers options page](./options/astTransformers.md)
  - `diagnostics`: see more at [diagnostics options page](./options/diagnostics.md)
  - `babelConfig`: see more at [babelConfig options page](./options/babelConfig.md)
  - `stringifyContentPathRegex`: see more at [stringifyContentPathRegex options page](./options/stringifyContentPathRegex.md)

#### Returns

An object contains Jest's `transform` property:

```ts
interface TsJestTransformerOptions {
  tsconfig?: boolean | string | RawCompilerOptions
  isolatedModules?: boolean
  astTransformers?: ConfigCustomTransformer
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        ignoreCodes?: number | string | Array<number | string>
        exclude?: string[]
        warnOnly?: boolean
      }
  babelConfig?: boolean | string | BabelConfig
  stringifyContentPathRegex?: string | RegExp
}

export type JsWithBabelPreset = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest/legacy', TsJestTransformerOptions]
  }
}
```

#### Example:

```ts title="jest.config.ts"
import { createJsWithBabelEsmLegacyPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createJsWithBabelEsmLegacyPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### Legacy presets

:::warning

`ts-jest` **DON'T RECOMMEND** to use legacy presets because this approach is not flexible to configure Jest configuration.
These legacy presets will be removed in the next major release and users are **HIGHLY RECOMMENDED** to migrate to use the above utility functions.

:::

| Preset name                                                           | Description                                                                                                                                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ts-jest/presets/default`<br/>or `ts-jest`                            | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                            |
| `ts-jest/presets/default-legacy`<br/>or `ts-jest/legacy` (**LEGACY**) | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                            |
| `ts-jest/presets/default-esm`<br/>                                    | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                                 |
| `ts-jest/presets/default-esm-legacy`<br/> (**LEGACY**)                | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, leaving JavaScript files (`.js`, `jsx`) as-is.                                                                 |
| `ts-jest/presets/js-with-ts`                                          | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`) will be transformed by `ts-jest` to **CommonJS** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file.    |
| `ts-jest/presets/js-with-ts-legacy` (**LEGACY**)                      | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`) will be transformed by `ts-jest` to **CommonJS** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file.    |
| `ts-jest/presets/js-with-ts-esm`                                      | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`) will be transformed by `ts-jest` to **ESM** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file. |
| `ts-jest/presets/js-with-ts-esm-legacy` (**LEGACY**)                  | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`) will be transformed by `ts-jest` to **ESM** syntax.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file. |
| `ts-jest/presets/js-with-babel`                                       | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, and JavaScript files (`.js`, `jsx`) will be transformed by `babel-jest`.                                  |
| `ts-jest/presets/js-with-babel-legacy` (**LEGACY**)                   | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **CommonJS** syntax, and JavaScript files (`.js`, `jsx`) will be transformed by `babel-jest`.                                  |
| `ts-jest/presets/js-with-babel-esm`                                   | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, and JavaScript files (`.js`, `jsx`, `.mjs`) will be transformed by `babel-jest`.                               |
| `ts-jest/presets/js-with-babel-esm-legacy` (**LEGACY**)               | TypeScript files (`.ts`, `.tsx`) will be transformed by `ts-jest` to **ESM** syntax, and JavaScript files (`.js`, `jsx`, `.mjs`) will be transformed by `babel-jest`.                               |

#### Example

```ts title="jest.config.ts"
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // Replace `<preset_name>` with the one of the preset names from the table above
  preset: '<preset_name>',
}

export default jestConfig
```
