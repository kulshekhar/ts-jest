import { mocked } from 'ts-jest/utils'
import { foo, bar } from './to-mock'
jest.mock('./to-mock')

it('should fail to compile', () => {
  // the method does not accept any arg
  expect(mocked(foo)('hello')).toBeUndefined()
  // the method accepts a string so typing should fail here
  expect(mocked(bar, true).dummy.deep.deeper(42)).toBeUndefined()
})
