import { mocked } from 'ts-jest/utils'
import { foo, bar } from './to-mock'
jest.mock('./to-mock')

test('foo', () => {
  // real returns 'foo', mocked returns 'bar'
  expect(foo()).toBeUndefined()
  expect(mocked(foo).mock.calls.length).toBe(1)
})

test('bar', () => {
  const mockedBar = mocked(bar, true)
  // real returns 'foo', mocked returns 'bar'
  expect(mockedBar()).toBeUndefined()
  expect(mockedBar.dummy.deep.deeper()).toBeUndefined()
  expect(mockedBar.dummy.deep.deeper.mock.calls.length).toBe(1)
})
