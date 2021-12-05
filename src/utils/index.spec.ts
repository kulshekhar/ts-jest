test('should show warning when importing from `ts-jest/utils`', async () => {
  const consoleSpy = (console.warn = jest.fn())

  const { createJestPreset, pathsToModuleNameMapper } = await import('../../utils')

  createJestPreset()
  pathsToModuleNameMapper({})

  expect(consoleSpy).toHaveBeenCalledTimes(2)
  expect(consoleSpy.mock.calls.reduce((acc, val) => acc.concat(val), [])).toMatchSnapshot()
})
