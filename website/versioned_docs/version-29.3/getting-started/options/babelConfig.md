---
title: Babel Config option
---

`ts-jest` by default does **NOT** use Babel. But you may want to use it, especially if your code rely on Babel plugins to make some transformations. `ts-jest` can call the BabelJest processor once TypeScript has transformed the source into JavaScript.

The option is `babelConfig` and it works pretty much as the `tsconfig` option, except that it is disabled by default. Here is the possible values it can take:

- `false`: the default, disables the use of Babel
- `true`: enables Babel processing. `ts-jest` will try to find a `.babelrc`, `.babelrc.js`, `babel.config.js` file or a `babel` section in the `package.json` file of your project and use it as the config to pass to `babel-jest` processor.
- `{ ... }`: inline [Babel options](https://babeljs.io/docs/en/next/options). You can also set this to an empty object (`{}`) so that the default Babel config file is not used.

### Examples

#### Use default `babelrc` file

```js tab
// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
}
```

```ts tab
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
}

export default jestConfig
```

```JSON tab
// package.json
{
  // [...]
  "jest": {
    "transform": {
      // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
      // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          "babelConfig": true
        }
      ]
    }
  }
}
```

#### Path to a `babelrc` file

The path should be relative to the current working directory where you start Jest from. You can also use `\<rootDir>` in the path, or use an absolute path (this last one is strongly not recommended).

```js tab
// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: 'babelrc.test.js',
      },
    ],
  },
}
```

```ts tab
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: 'babelrc.test.js',
      },
    ],
  },
}

export default jestConfig
```

```JSON tab
// package.json
{
  // [...]
  "jest": {
    "transform": {
      // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
      // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          "babelConfig": "babelrc.test.js"
        }
      ]
    }
  }
}
```

or importing directly the config file:

```js tab
// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: require('./babelrc.test.js'),
      },
    ],
  },
}
```

```ts tab
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest'
import babelConfig from './babelrc.test.js'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig,
      },
    ],
  },
}

export default jestConfig
```

#### Inline compiler options

Refer to the [Babel options](https://babeljs.io/docs/en/next/options) to know what can be used there.

```js tab
// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: {
          comments: false,
          plugins: ['@babel/plugin-transform-for-of'],
        },
      },
    ],
  },
}
```

```ts tab
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  // [...]
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: {
          comments: false,
          plugins: ['@babel/plugin-transform-for-of'],
        },
      },
    ],
  },
}

export default jestConfig
```

```JSON tab
// package.json
{
  // [...]
  "jest": {
    "transform": {
      // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
      // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          "babelConfig": {
            "comments": false,
            "plugins": ["@babel/plugin-transform-for-of"]
          }
        }
      ]
    }
  }
}
```
