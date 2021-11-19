import { mocked, createJestPreset, pathsToModuleNameMapper, MockedObject } from 'ts-jest'

test('should expose mocked/createJestPreset/pathsToModuleNameMapper', () => {
  expect(typeof mocked).toBe('function')
  expect(typeof createJestPreset).toBe('function')
  expect(typeof pathsToModuleNameMapper).toBe('function')
})

test('should expose mock types', async () => {
  interface SomeInterface {
    validate(): boolean
  }
  const UserValidator: SomeInterface = {
    validate: () => true,
  }
  async function someFunction() {
    return [UserValidator]
  }

  const mockedValidator: Array<MockedObject<SomeInterface>> = (await someFunction()).map((v: SomeInterface) =>
    mocked(v),
  )

  expect(mockedValidator).toBeDefined()
})
