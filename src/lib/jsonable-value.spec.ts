import { JsonableValue } from './jsonable-value'
import * as json from './json'

it('should cache the seralized value', () => {
  const spy = jest.spyOn(json, 'stringify')
  const jv = new JsonableValue({ foo: 'bar' })
  expect(jv.serialized).toBe('{"foo":"bar"}')
  expect(spy).toHaveBeenCalledTimes(1)
  expect(jv.serialized).toBe('{"foo":"bar"}')
  expect(spy).toHaveBeenCalledTimes(1)
})

it('should update the serialized value when updating the value', () => {
  const spy = jest.spyOn(json, 'stringify')
  const jv = new JsonableValue({ foo: 'bar' } as any)
  expect(jv.serialized).toBe('{"foo":"bar"}')
  spy.mockClear()
  jv.value = { bar: 'foo' }
  expect(jv.serialized).toBe('{"bar":"foo"}')
  expect(jv.serialized).toBe('{"bar":"foo"}')
  expect(spy).toHaveBeenCalledTimes(1)
})
