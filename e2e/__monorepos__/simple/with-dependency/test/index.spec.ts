import { fn } from '../index'

describe('simple test', () => {
  it('should compile typescript function from node_modules', async () => {
    expect(fn()).toEqual(1.0)
  })
})
