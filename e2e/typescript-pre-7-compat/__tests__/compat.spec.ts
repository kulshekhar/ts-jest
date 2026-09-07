import { throwMappedError } from '../src/source-map'
import { transformed } from '../src/transformed'

describe('TypeScript compatibility', () => {
  it('runs custom transformers', () => {
    expect(transformed).toBe('__TRANSFORMED__')
  })

  it('preserves source maps', () => {
    expect(throwMappedError).toThrow(/mapped failure/)

    try {
      throwMappedError()
    } catch (error) {
      expect((error as Error).stack).toMatch(/source-map\.ts:2:\d+/)
    }
  })
})
