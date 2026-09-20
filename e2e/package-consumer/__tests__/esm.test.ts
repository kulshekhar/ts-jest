import { packageFormat } from '../src/esm-value'

describe('packed ts-jest package in ESM mode', () => {
  it('should transform a TypeScript ESM consumer', () => {
    expect(packageFormat).toBe('esm')
  })
})
