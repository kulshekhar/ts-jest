import { mocked } from 'ts-jest'
import { foo } from './to-mock'
jest.mock('./to-mock')

test('foo', () => {
  foo()
  // it should log that the helper moved
  expect(mocked(foo).mock.calls.length).toBe(1)
})
