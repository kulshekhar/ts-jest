---
id: esm-support
title: ESM Support
---

## References

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(1)} />

---

### Configuration

To use `ts-jest` with ESM support:

- Check [ESM Jest documentation](https://jestjs.io/docs/en/ecmascript-modules).
- Ensure that `tsconfig` has `module` with value for ESM, e.g. `ES2022`/`ESNext` etc...

#### Example:

```json
// tsconfig.spec.json
{
  "compilerOptions": {
    "module": "ESNext", // or ES2022
    "target": "ESNext",
    "esModuleInterop": true
  }
}
```

- Configure your Jest configuration use one of the [utility functions](../getting-started/presets.md)

#### Example:

```ts
// jest.config.mts
import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
}

export default jestConfig
```

### Resolve `.mjs/.mts` extensions

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
