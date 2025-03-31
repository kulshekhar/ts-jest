---
id: esm-support
title: ESM Support
---

:::important

`ts-jest` will take into account of the following things when working with ESM:

- [Jest Runtime](https://jestjs.io/docs/en/ecmascript-modules)
- Check `type: "module"` in `package.json` **ONLY WHEN** `module` in `tsconfig` has hybrid value: either `Node16`/`Node18`/`NodeNext`
- When `module` in `tsconfig` isn't set to a hybrid value, `module` **MUST HAVE** one of the ES values, e.g. `ES2015`, `ES2020` etc...

:::

# References

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(0)} />

---

## Configure Jest runtime

Check [ESM Jest documentation](https://jestjs.io/docs/en/ecmascript-modules).

:::info

Jest runtime currently has a few issues related to support ESM:

- Not taking into account of `type: "module"` field in `package.json` yet to run as ESM mode.
- Mocking ES modules are not supported yet, track progress here https://github.com/jestjs/jest/pull/10976

Overall progress and discussion can be found at https://github.com/jestjs/jest/issues/9430

:::

## Configure `tsconfig`

### Using ES module values

```json
// tsconfig.spec.json
{
  "compilerOptions": {
    "module": "ESNext", // or any values starting with "es" or "ES"
    "target": "ESNext",
    "esModuleInterop": true
  }
}
```

### Using hybrid module values

:::important

Hybrid module values requires `type` field in `package.json` to be set explicitly to:

- `commonjs` for `CommonJS` code
- `module` for `ESM` code

:::

```json
// tsconfig.spec.json
{
  "compilerOptions": {
    "module": "Node16", // or Node18/NodeNext
    "target": "ESNext",
    "esModuleInterop": true
  }
}
```

## Configure Jest config

Configure your Jest configuration to use one of the [utility functions](../getting-started/presets.md)

### Example

```ts
// jest.config.ts
import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
})

const jestConfig: Config = {
  ...presetConfig,
}

export default jestConfig
```

## Resolve `.mjs/.mts` extensions

To work with `.mts` extension, besides the requirement to run Jest and `ts-jest` in ESM mode, there are a few extra requirements to be met:

- `package.json` should contain `"type": "module"`
- A custom Jest resolver to resolve `.mjs` extension, for example:

```ts tab={"label": "TypeScript CJS"}
import type { SyncResolver } from 'jest-resolve'

const mjsResolver: SyncResolver = (path, options) => {
  const mjsExtRegex = /\.mjs$/i
  const resolver = options.defaultResolver
  if (mjsExtRegex.test(path)) {
    try {
      return resolver(path.replace(mjsExtRegex, '.mts'), options)
    } catch {
      // use default resolver
    }
  }

  return resolver(path, options)
}

export = mjsResolver
```

```ts tab={"label": "TypeScript ESM"}
import type { SyncResolver } from 'jest-resolve'

const mjsResolver: SyncResolver = (path, options) => {
  const mjsExtRegex = /\.mjs$/i
  const resolver = options.defaultResolver
  if (mjsExtRegex.test(path)) {
    try {
      return resolver(path.replace(mjsExtRegex, '.mts'), options)
    } catch {
      // use default resolver
    }
  }

  return resolver(path, options)
}

export default mjsResolver
```
