import { mocked } from 'ts-jest/utils'
import { foo, bar, MyClass } from './to-mock'
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

test("MyClass", () => {
  const instance = new MyClass("hi");
  const otherInstance = new MyClass("there");
  expect(mocked(MyClass).mock.calls.length).toBe(2);

  const mockedInstance = mocked(instance, true);
  // mocked always returns undefined by default
  expect(instance.myStr).toBeUndefined();
  expect(mockedInstance.myProperty).toBeUndefined();
  expect(instance.somethingClassy()).toBeUndefined();
  expect(mockedInstance.somethingClassy.mock.calls.length).toBe(1);
  expect(mocked(otherInstance).somethingClassy.mock.calls.length).toBe(0);
});
