import { createJestPreset } from './create-jest-preset'

it('should return correct defaults when allowJs is false or not set', () => {
  const withoutJs = {
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  }
  expect(createJestPreset()).toEqual(withoutJs)
  expect(createJestPreset({ allowJs: false })).toEqual(withoutJs)
})

it('should return correct defaults when allowJs is true', () => {
  expect(createJestPreset({ allowJs: true })).toEqual({
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
    transform: {
      '^.+\\.[tj]sx?$': 'ts-jest',
    },
  })
})

it('should be able to use a base config', () => {
  expect(createJestPreset(undefined, {})).toMatchInlineSnapshot(`
Object {
  "transform": Object {
    "^.+\\\\.tsx?$": "ts-jest",
  },
}
`)
  expect(createJestPreset(undefined, { testMatch: ['foo'], moduleFileExtensions: ['bar'], transform: { foo: 'bar' } }))
    .toMatchInlineSnapshot(`
Object {
  "moduleFileExtensions": Array [
    "bar",
  ],
  "testMatch": Array [
    "foo",
  ],
  "transform": Object {
    "^.+\\\\.tsx?$": "ts-jest",
    "foo": "bar",
  },
}
`)
})
