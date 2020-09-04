import { isStoreOwner } from './foo';
import { getWelcomeMessage } from '@share/get-welcome-message';
import type { Foo } from '@share/typings'

describe('Test optional chaining', () => {
  test(`should work`, () => {
    expect(isStoreOwner({
      isStoreOwner: false,
    })).toEqual(false)
  })

  test(`test export *`, () => {
    expect(getWelcomeMessage('foo')).toEqual('yolo foo')
  })

  test(`test import type`, () => {
    const foo: Foo = {
      bar: 1,
    }

    expect(foo).toBeTruthy()
  })
});
