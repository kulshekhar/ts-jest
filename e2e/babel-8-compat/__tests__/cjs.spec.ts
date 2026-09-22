import { babelVersionMarker } from '../src/cjs-message'

describe('Babel 8 CommonJS compatibility', () => {
  it('processes JavaScript through ts-jest and Babel', () => {
    expect(babelVersionMarker).toBe('Babel 8')
  })
})
