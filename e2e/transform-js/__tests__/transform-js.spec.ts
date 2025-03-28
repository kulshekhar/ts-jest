import { inc } from '../src/stateful'

describe('transform js', () => {
  it('should process js file', () => {
    expect(inc()).toBe(1)
  })
})
