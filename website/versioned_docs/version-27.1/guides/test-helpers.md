---
id: test-helpers
title: Test helpers
---

:::warning

This function is now deprecated and will be removed in **28.0.0**. The function has been integrated into `jest-mock` package
as a part of Jest **27.4.0**, see https://github.com/facebook/jest/pull/12089. Please use the one from `jest-mock` instead.

:::

`ts-jest` provides some test utilities to be used in your test, related to TypeScript.

## `mocked<T>(item: T, deep = false)`

The `mocked` test helper provides typings on your mocked modules and even their deep methods, based on the typing of its source. It makes use of the latest TypeScript feature, so you even have argument types completion in the IDE (as opposed to `jest.MockInstance`).

**Note:** while it needs to be a function so that input type is changed, the helper itself does nothing else than returning the given input value.

### Example

```ts
// foo.ts
export const foo = {
  a: {
    b: {
      c: {
        hello: (name: string) => `Hello, ${name}`,
      },
    },
  },
  name: () => 'foo',
}
```

```ts
// foo.spec.ts
import { mocked } from 'ts-jest/utils'
import { foo } from './foo'
jest.mock('./foo')

// here the whole foo var is mocked deeply
const mockedFoo = mocked(foo, true)

test('deep', () => {
  // there will be no TS error here, and you'll have completion in modern IDEs
  mockedFoo.a.b.c.hello('me')
  // same here
  expect(mockedFoo.a.b.c.hello.mock.calls).toHaveLength(1)
})

test('direct', () => {
  foo.name()
  // here only foo.name is mocked (or its methods if it's an object)
  expect(mocked(foo.name).mock.calls).toHaveLength(1)
})
```
