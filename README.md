# typescript-jest 

[![Build Status](https://semaphoreci.com/api/v1/k/typescript-jest/branches/master/badge.svg)](https://semaphoreci.com/k/typescript-jest)

**Note:** This is currently just a hack and most likely not suitable for all setups. 

## Details

This repo uses code from the [source-map-support](https://github.com/evanw/node-source-map-support) package to show errors with mapped locations.

To use this in its current form, clone this repo anywhere on your disk. Run `npm install` in it.
Create a symlink in the `node_modules` directory of your project to this directory:

```sh
ln -s path-to-typescript-jest
```

such that you effectively have a `node_modules/typescript-jest` directory.

Modify your project's `package.json` so that the `jest` section looks something like:

```json
{
  "jest": {
    "scriptPreprocessor": "<rootDir>/node_modules/typescript-jest/preprocessor.js",
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
      "<rootDir>/node_modules/typescript-jest/"
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

This should allow you to write Jest tests in Typescript and be able to locate errors without any additional gymnastics.

If you have any suggestions/pull requests to turn this into a useful package, just open an issue and I'll be happy to work with you to improve this.

## Quickstart to run tests

```sh
git clone https://github.com/kulshekhar/typescript-jest
cd typescript-jest
npm install
./test-init.sh
npm test
```

It is assumed that `typescript` and `jest-cli` are globally installed. If not, please do so:

```sh
npm i -g typescript jest-cli
```