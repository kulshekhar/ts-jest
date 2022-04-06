import { Chocolate } from '../chocolate'
import { color } from '../entry'

jest.mock('some-module', () => ({} as Partial<Record<string, unknown>>), { virtual: true })

jest.mock('../entry', () => {
  return { color: 'blue' }
})

const mockEat = jest.fn().mockReturnValue('sweet')
jest.mock('../chocolate', () => ({
  eat: mockEat,
}))

describe('hoisting', () => {
  test('works even with type imports', () => {
    expect(color).toBe('blue')
  })
  test('permits access to variables starting with "mock"', () => {
    const chocolate = new Chocolate()
    expect(chocolate.eat()).toBe('sweet')
  })
})
