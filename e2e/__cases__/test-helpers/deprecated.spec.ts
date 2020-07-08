import { mocked } from 'ts-jest'
import { foo } from './pass-to-mock'
jest.mock('./pass-to-mock')

test('foo', () => {
  foo()
  // it should log that the helper moved
  expect(mocked(foo).mock.calls.length).toBe(1)
})
