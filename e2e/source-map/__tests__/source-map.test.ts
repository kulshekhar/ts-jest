interface SourceMappedResult {
  actual: boolean
}

const result: SourceMappedResult = { actual: true }

it('should report the original TypeScript location', () => {
  const expected: boolean = false

  expect(result.actual).toBe(expected)
})
