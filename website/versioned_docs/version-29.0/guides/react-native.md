---
id: react-native
title: Using with React Native
---

To use `ts-jest` with React Native + TypeScript and Babel 7, you'll first need to follow [this tutorial](https://reactnative.dev/blog/2018/05/07/using-typescript-with-react-native).

After that, some little modifications will be required as follows:

### Babel config

If you didn't yet, move any Babel config from `.babelrc` to `babel.config.js`. It should at least contain:

```js title="babel.config.js"
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
}
```

### TypeScript Configuration

Create a new `tsconfig.spec.json` at the root of your project with the following content

```json title="tsconfig.spec.json"
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react"
  }
}
```

### Jest config

In the same way that you moved Babel config, move Jest config from `jest` key of `package.json` to `jest.config.js`. It should look like this:

```js tab
// jest.config.js
const { defaults: tsjPreset } = require('ts-jest/presets')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
```

```ts tab
// jest.config.ts
import { defaults as tsjPreset } from 'ts-jest/presets'
import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'react-native',
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

export default jestConfig
```
