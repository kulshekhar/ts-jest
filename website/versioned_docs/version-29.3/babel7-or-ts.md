---
id: babel7-or-ts
title: Babel7 or TypeScript
---

In Sept. 2018 Babel7 got released with an interesting preset: `@babel/preset-typescript`.

The goal is to make it easy for users using Babel to try TypeScript without moving out from Babel, just by adding a preset in their Babel config (here is the [MSDN blog post](https://blogs.msdn.microsoft.com/typescript/2018/08/27/typescript-and-babel-7/) about TypeScript and Babel 7).

## Limitations

While `@babel/preset-typescript` is a great preset, you must know the limitation of it. Here is what is possible with TypeScript (and `ts-jest`), which is not with Babel7 and `@babel/preset-typescript`:

#### No type-checking

This is the big **PRO** of using TypeScript vs Babel, you have type-checking out of the box.

You'll get a more fluent TDD experience (when using `ts-jest`) since files will be type-checked at the same time they're compiled and ran.

Here TypeScript will throw while Babel won't:

```ts
const str: string = 42
```

With Babel, files are transpiled as isolated modules, there is no notion of "project". With TypeScript, files are part of a project and are compiled in that scope.

---

#### No `namespace`

```ts
namespace app {
  export const VERSION = '1.0.0'
  export class App {
    /* ... */
  }
}
```

---

#### No `const enum`

```ts
const enum Directions {
  Up,
  Down,
  Left,
  Right,
}
```

---

#### No declaration merging (`enum`, `namespace`, ...)

You won't be able to do [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).

---

#### No legacy `import`/`export`

```ts
import lib = require('lib')
// ...
export = myVar
```

---

#### No caret type-casting with JSX enabled

```ts
const val = <string>input
```
