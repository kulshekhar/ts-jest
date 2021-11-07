jest.mock('../sum-dependency') // call mock explicitly

import { sum } from '../sum'

describe('sum', () => {
  test('adds numbers', () => {
    expect(sum(1, 2)).toEqual(3)
  })
})
