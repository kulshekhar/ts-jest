# ts-jest 

[![Build Status](https://semaphoreci.com/api/v1/k/ts-jest/branches/master/badge.svg)](https://semaphoreci.com/k/ts-jest)

**Note:** This is currently just a hack and might not be suitable for all setups. 

## Details

> **Note:** This repo uses code from the [source-map-support](https://github.com/evanw/node-source-map-support) package to show errors with mapped locations.

To use this in your project, run:

```sh
npm install --save-dev ts-jest
```

Modify your project's `package.json` so that the `jest` section looks something like:

```json
{
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/ts-jest/preprocessor.js",
    "testFileExtensions": [
      "ts",
      "tsx",
      "js"
    ],
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js"
    ],
    "unmockedModulePathPatterns": [
      "<rootDir>/node_modules/react/",
      "<rootDir>/node_modules/react-dom/",
      "<rootDir>/node_modules/react-addons-test-utils/",
      "<rootDir>/node_modules/ts-jest/"
    ],
    "globals": {
      "__TS_CONFIG__": {
        "module": "commonjs",
        "jsx": "react"
      }
    }
  }
}
```

> **Note:** It's currently necessary to have `globals > __TS_CONFIG__` present in your `package.json` even if it is only an empty object.

This setup should allow you to write Jest tests in Typescript and be able to locate errors without any additional gymnastics.

If you have any suggestions/pull requests to turn this into a useful package, just open an issue and I'll be happy to work with you to improve this.

## Quickstart to run tests (only if you're working on this package)

```sh
git clone https://github.com/kulshekhar/ts-jest
cd ts-jest
npm install
./test-init.sh
npm test
```

It is assumed that `jest-cli` is globally installed. If not, please do so:

```sh
npm i -g jest-cli
```