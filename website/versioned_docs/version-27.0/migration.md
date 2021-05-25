---
id: migration
title: Migration from <=23.10
---

You can use the `config:migrate` tool of `ts-jest` CLI if you're coming from an older version to help you migrate your Jest configuration.

_If you're using `jest.config.js`:_

### NPM

```sh
npx ts-jest config:migrate jest.config.js
```

### Yarn

```sh
yarn ts-jest config:migrate jest.config.js
```

_If you're using `jest` config property of `package.json`:_

### NPM

```sh
npx ts-jest config:migrate package.json
```

### Yarn

```sh
yarn ts-jest config:migrate package.json
```
