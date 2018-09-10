import { rootLogger } from './logger'

jest.unmock('./logger')

// ths is just a simple test to ensure we do have a logger
describe('rootLogger', () => {
  it('should be a logger', () => {
    expect(typeof rootLogger).toBe('function')
  })
})
