---
id: installation
title: Installation
---

### Dependencies

You can install `ts-jest` and dependencies all at once with one of the following commands.

```bash npm2yarn
npm install --save-dev jest typescript ts-jest @types/jest
```

:::tip

Tip: If you get an error with the following `npm` commands such as `npx: command not found`, you can replace `npx XXX` with `node node_modules/.bin/XXX` from the root of your project.

:::

### Jest config file

:::tip

For ESM configuration, please see more in details with [ESM guide](../../guides/esm-support).

:::

#### Creating

By default, Jest can run without any config files, but it will not compile `.ts` files.
To make it transpile TypeScript with `ts-jest`, we will need to create a configuration file that will tell Jest to use a `ts-jest` preset.

`ts-jest` can create the configuration file for you automatically:

```npm tab
npx ts-jest config:init
```

```Yarn tab
yarn ts-jest config:init
```

This will create a basic Jest configuration file which will inform Jest about how to handle `.ts` files correctly.

You can also use the `create-jest` command (prefixed with either `npx` or `yarn` depending on what you're using) to have more options related to Jest.
However, answer `no` to the Jest question about whether or not to enable TypeScript. Instead, add the line: `preset: "ts-jest"` to the `jest.config.js` file afterwards.

#### Customizing

For customizing jest, please follow their [official guide online](https://jestjs.io/docs/en/configuration.html).

`ts-jest` specific options can be found [here](./options.md).
