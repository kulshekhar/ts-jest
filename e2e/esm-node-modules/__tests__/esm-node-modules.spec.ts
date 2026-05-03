import { add } from 'esm-only-pkg'

describe('esm-only-pkg', () => {
  it('can import and use a function from an ESM-only node_modules package', () => {
    expect(add(1, 2)).toBe(3)
  })
})
