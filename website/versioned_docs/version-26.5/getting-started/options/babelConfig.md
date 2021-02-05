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

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
}
```

```json
// OR package.json
{
  // [...]
  "jest": {
    "globals": {
      "ts-jest": {
        "babelConfig": true
      }
    }
  }
}
```

#### Path to a `babelrc` file

The path should be relative to the current working directory where you start Jest from. You can also use `\<rootDir>` in the path, or use an absolute path (this last one is strongly not recommended).

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      babelConfig: 'babelrc.test.js',
    },
  },
}
```

```js
// OR jest.config.js with require for babelrc
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      babelConfig: require('./babelrc.test.js'),
    },
  },
}
```

```json
// OR package.json
{
  // [...]
  "jest": {
    "globals": {
      "ts-jest": {
        "babelConfig": "babelrc.test.js"
      }
    }
  }
}
```

#### Inline compiler options

Refer to the [Babel options](https://babeljs.io/docs/en/next/options) to know what can be used there.

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      babelConfig: {
        comments: false,
        plugins: ['@babel/plugin-transform-for-of'],
      },
    },
  },
}
```

```json
// OR package.json
{
  // [...]
  "jest": {
    "globals": {
      "ts-jest": {
        "babelConfig": {
          "comments": false,
          "plugins": ["@babel/plugin-transform-for-of"]
        }
      }
    }
  }
}
```
