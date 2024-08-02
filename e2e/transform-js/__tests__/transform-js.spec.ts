describe('transform js', () => {
  it('should process mjs file', async () => {
    const { default: importedStateful } = await import('../src/stateful.mjs')

    expect(importedStateful()).toBe(1)
  })

  it('should process cjs file', async () => {
    const { default: importedStateful } = await import('../src/stateful.cjs')

    expect(importedStateful()).toBe(1)
  })
})
