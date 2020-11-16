import * as tsJest from '.'
import { TsJestTransformer } from './ts-jest-transformer'

describe('createTransformer', () => {
  it('should create different instances', () => {
    const tr1 = tsJest.createTransformer()
    const tr2 = tsJest.createTransformer()
    expect(tr1).toBeInstanceOf(TsJestTransformer)
    expect(tr2).toBeInstanceOf(TsJestTransformer)
    expect(tr1).not.toBe(tr2)
  })
})
