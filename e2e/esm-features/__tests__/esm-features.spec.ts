import jsonImportAssertion from '../src/foo.json' assert { type: 'json' }

const topLevelAwait = await import('../src/foo.json')

const itWithRunNode18Above = (...args: Parameters<typeof it>) => {
  const [major] = process.versions.node.split('.').map(Number)
  if (major > 16) {
    // eslint-disable-next-line jest/valid-title,jest/expect-expect,jest/no-disabled-tests
    return it(...args)
  }

  // eslint-disable-next-line jest/valid-title,jest/expect-expect,jest/no-disabled-tests
  return it.skip(...args)
}

describe('esm-features', () => {
  it('should work with import.meta', () => {
    expect(import.meta.jest).toBeDefined()
  })

  it('should work with import assertion', () => {
    expect(jsonImportAssertion.name).toBe('hello')
  })

  itWithRunNode18Above('should work with import attributes', async () => {
    const jsonImportAttrs = await import('../src/foo.json', { with: { type: 'json' } })
    // eslint-disable-next-line jest/no-standalone-expect
    expect(jsonImportAttrs.default.name).toBe('hello')
  })

  it('should work with top-level await', () => {
    expect(topLevelAwait.default.name).toBe('hello')
  })
})
