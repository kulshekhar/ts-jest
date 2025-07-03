---
id: esm-support
title: ESM Support
---

:::important

Jest will take into account of the following things when working with ESM:

- [ESM runtime](https://jestjs.io/docs/en/ecmascript-modules)
- The value of `module` option in tsconfig file is either:
  - `Node16/Node18/NodeNext`: this **MUST** go together with `type: "module"` in `package.json`.
  - Otherwise, the value **MUST BE** one of the ES values, e.g. `ES2015`, `ES2020` etc...

:::

One can configure `ts-jest` to work with Jest in ESM mode by following the steps below.

:::tip

We have [**EXAMPLE APPS**](https://github.com/kulshekhar/ts-jest/tree/main/examples) which contains some projects which have basic setup to work with ESM (next to CJS config).

:::

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(0)} />

---

## Configure Jest runtime

:::warning

Jest runtime currently has a few issues related to support ESM:

- Not taking into account of `type: "module"` field in `package.json` yet to run as ESM mode.
- Mocking ES modules are not supported yet, track progress here https://github.com/jestjs/jest/pull/10976

Overall progress and discussion can be found at https://github.com/jestjs/jest/issues/9430

:::

:::info

If one is using Jest config in TypeScript, one should install `ts-node` as a dev dependency.

```bash npm2yarn

npm install -D ts-node

```

:::

Execute Jest with with `--experimental-vm-modules` flag for `NodeJs`

```bash

node --experimental-vm-modules node_modules/jest/bin/jest.js

```

:::tip

Alternative way for `Yarn` users:

```bash

yarn node --experimental-vm-modules $(yarn bin jest)

```

This command will also work if you use `Yarn Plug'n'Play.`

:::

## Configure `tsconfig`

One can choose **EITHER ONE** of the following options for `tsconfig`:

### Using ES module values

:::tip

See more details about [ES module values](https://www.typescriptlang.org/docs/handbook/modules/reference.html#es2015-es2020-es2022-esnext)

:::

:::important

`ts-jest` recommends to use `ES2022` or `ESNext` when using `ES` module values to achieve full support for all recent ESM features.

:::

```json title="tsconfig.spec.json"
{
  "compilerOptions": {
    "module": "ES2022", // or `ESNext`
    "target": "ESNext",
    "esModuleInterop": true
  }
}
```

### Using hybrid module values

:::tip

See more details about [hybrid module](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-nodenext)

:::

:::important

Currently, the code transpiler **ONLY** supports hybrid values with `isolatedModules: true`

:::

```json title="tsconfig.spec.json"
{
  "compilerOptions": {
    "module": "Node16", // or Node18/NodeNext
    "target": "ESNext",
    "esModuleInterop": true,
    "isolatedModules": true
  }
}
```

## Configure Jest config

:::tip

Jest will attempt to load **ESM** files from `node_modules` with default `jest-resolve` which usually works for most of the cases.
However, there are cases like Angular libraries **ESM** built files or **ESM** files which are outside `node_modules` might not be loaded
correctly.

To fix that, one can use `moduleNameMapper` in jest config to instruct Jest to load the correct **ESM** files or create a
custom Jest [resolver](https://jestjs.io/docs/configuration#resolver-string).

:::

### Using ESM presets

:::tip

See available ESM preset creator functions [**HERE**](../getting-started/presets.md)

:::

```ts title="jest.config.ts"
import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
})

export default {
  ...presetConfig,
} satisfies Config
```

### NOT using ESM presets

```ts title="jest.config.ts"
import type { Config } from 'jest'
import { TS_EXT_TO_TREAT_AS_ESM, ESM_TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        //...other `ts-jest` options
        useESM: true,
      },
    ],
  },
} satisfies Config
```

## Resolve `.mjs/.mts` extensions

To work with `.mts` extension, besides the requirement to run Jest and `ts-jest` in ESM mode, there are a few extra requirements to be met:

- `package.json` should contain `"type": "module"`
- A custom Jest resolver to resolve `.mjs` extension, for example:

```ts title="custom-resolver.ts"
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

and then add this to Jest config:

```ts title="jest.config.ts"
import type { Config } from 'jest'

const config: Config = {
  //...other options
  resolver: '<rootDir>/path/to/custom-resolver.ts',
}
```
