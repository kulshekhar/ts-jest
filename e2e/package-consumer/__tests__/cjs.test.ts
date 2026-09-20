import { packageFormat } from '../src/cjs-value'

describe('packed ts-jest package in CommonJS mode', () => {
  it('should transform a TypeScript CommonJS consumer', () => {
    expect(packageFormat).toBe('commonjs')
  })
})
