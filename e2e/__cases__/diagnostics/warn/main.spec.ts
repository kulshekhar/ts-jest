import { foo, Thing } from './main';

export const thing: Thing = { a: 1 };

test('foo is 42', () => {
  expect(foo).toBe(42);
});
