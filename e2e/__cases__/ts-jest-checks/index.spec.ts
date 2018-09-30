import { createTransformer } from 'ts-jest'
import { readFileSync } from 'fs'

describe('tsConfig', () => {
  it('should have digest and versions', () => {
    const tr = createTransformer()
    const cs = tr.configsFor({} as any)
    expect(cs.tsJestDigest).toHaveLength(40)
    expect(cs.tsJestDigest).toBe(readFileSync(require.resolve('ts-jest/.ts-jest-digest'), 'utf8'))
    expect(cs.versions['ts-jest']).toBe(require('ts-jest/package.json').version)
  })
})
