import { color } from '../entry'

jest.mock('some-module', () => ({} as Partial<Record<string, unknown>>), { virtual: true })

jest.mock('../entry', () => {
  return { color: 'blue' }
})

describe('hoisting', () => {
  test('works even with type imports', () => {
    expect(color).toBe('blue')
  })
})
