test('should show warning when importing from `ts-jest/utils`', async () => {
  console.warn = jest.fn()

  await import('../../utils')

  expect(console.warn).toHaveBeenCalledWith(
    'ts-jest[main] (WARN) Replace any occurrences of "ts-jest/utils" with just "ts-jest".',
  )
})
