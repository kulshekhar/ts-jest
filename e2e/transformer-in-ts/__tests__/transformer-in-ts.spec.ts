import { describe, expect, it } from '@jest/globals'

describe('transformer-in-ts', () => {
  it('should use custom AST transformer written in ts', () => {
    expect(true).toBe(true)
  })
})
