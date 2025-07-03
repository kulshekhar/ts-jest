---
id: hybrid-node-module
title: Hybrid Node module
---

When using hybrid node `module` values, `Node16`/`Node18`/`NodeNext`, one should read [TypeScript documentation](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-nodenext)
to understand how the emitted code looks like.

:::important

At the moment, `ts-jest` uses TypeScript API to transpile code so the emitted `js` code depends on the `TypeScript` version used.

:::

There will be a few differences from traditional `CommonJs`, e.g. `dynamic import` **WON'T** be transformed into `Promise` and `require`.
