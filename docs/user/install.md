---
title: Installing TSJest
---
TSJest is a Jest pre-processor, so you'll need to install Jest. And it's a pre-processor for TypeScript... you'll need to install TypeScript as well in your project.

> Tip: If you get an error with the following `npm` commands such as `npx: command not found`, you can replace `npx XXX` with `node node_modules/.bin/XXX` from the root of your project.


## Dependencies

<div class="row"><div class="col-md-6" markdown="block">

Using `npm`:
```sh
npm install --save-dev jest typescript ts-jest
```

</div><div class="col-md-6" markdown="block">

Using `yarn`:
```sh
yarn add --dev jest typescript ts-jest
```

</div></div>

## Jest config file

### Creating

By default Jest can run without any config file, but it'll not take care of `.ts` files. That is why we need to create a configuration file to let Jest know how to transpile TypeScript files using TSJest.

<div class="row"><div class="col-md-6" markdown="block">

Using `npm`:
```sh
npx ts-jest config:init
```

</div><div class="col-md-6" markdown="block">

Using `yarn`:
```sh
yarn ts-jest config:init
```

</div></div>

This will create a basic Jest configuration file which will make Jest know about your `.ts` files and handle them correctly.

You can also use the `jest --init` command (prefixed with either `npx` or `yarn` depending on what you're using) to have more options related to Jest. But do not answer `yes` to the TypeScript related question, and then add `"preset": "ts-jest"` in the generated config.


### Customizing

For what it is about Jest options, follow their [official guide online](https://jestjs.io/docs/en/configuration.html).

TSJest specific options can be found [here](config).
