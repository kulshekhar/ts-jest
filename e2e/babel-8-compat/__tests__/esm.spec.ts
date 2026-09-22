import { babelVersionMarker } from '../src/esm-message'

describe('Babel 8 ESM compatibility', () => {
  it('processes TypeScript through ts-jest and Babel', () => {
    expect(babelVersionMarker).toBe('Babel 8')
  })
})
