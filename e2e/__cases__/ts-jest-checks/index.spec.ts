import { readFileSync } from 'fs'
import { ConfigSet } from 'ts-jest/dist/config/config-set'

it('should have digest and versions', () => {
  const cs = new ConfigSet(Object.create(null))
  expect(cs.tsJestDigest).toHaveLength(40)
  expect(cs.tsJestDigest).toBe(readFileSync(require.resolve('ts-jest/.ts-jest-digest'), 'utf8'))
})
