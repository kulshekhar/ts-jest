import { internals } from '.'

describe('transformers', () => {
  it('should return internal transformer', () => {
    expect(internals).toHaveLength(1)
    expect(internals).toMatchInlineSnapshot(`
      Array [
        Object {
          "factory": [Function],
          "name": "hoisting-jest-mock",
          "version": 4,
        },
      ]
    `)
  })
})
