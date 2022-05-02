---
id: using-with-monorepo
title: Using with monorepo
---

To use `ts-jest` in a project with monorepo structure, you'll need to use [Jest projects configuration](https://jestjs.io/docs/next/configuration#projects-arraystring--projectconfig).

When using Jest `projects` configuration, Jest will run `ts-jest` against each project which is defined in the configuration.
