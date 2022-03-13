import * as _json from './json'
import { JsonableValue } from './jsonable-value'

jest.mock('./json')

const { stringify } = jest.mocked(_json)

stringify.mockImplementation((v) => JSON.stringify(v))

beforeEach(() => {
  jest.clearAllMocks()
})

it('should cache the serialized value', () => {
  const jv = new JsonableValue({ foo: 'bar' })
  expect(jv.serialized).toBe('{"foo":"bar"}')
  expect(stringify).toHaveBeenCalledTimes(1)
  expect(jv.serialized).toBe('{"foo":"bar"}')
  expect(stringify).toHaveBeenCalledTimes(1)
})

it('should update the serialized value when updating the value', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jv = new JsonableValue({ foo: 'bar' } as any)
  expect(jv.serialized).toBe('{"foo":"bar"}')
  stringify.mockClear()
  jv.value = { bar: 'foo' }
  expect(jv.serialized).toBe('{"bar":"foo"}')
  expect(jv.serialized).toBe('{"bar":"foo"}')
  expect(stringify).toHaveBeenCalledTimes(1)
})
