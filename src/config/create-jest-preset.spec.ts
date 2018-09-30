import { createJestPreset } from './create-jest-preset'

it('should return correct defaults when allowJs is false or not set', () => {
  const withoutJs = {
    moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
    testMatch: [
      '**/__tests__/**/*.js?(x)',
      '**/?(*.)+(spec|test).js?(x)',
      '**/__tests__/**/*.ts?(x)',
      '**/?(*.)+(spec|test).ts?(x)',
    ],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  }
  expect(createJestPreset()).toEqual(withoutJs)
  expect(createJestPreset({ allowJs: false })).toEqual(withoutJs)
})

it('should return correct defaults when allowJs is true', () => {
  expect(createJestPreset({ allowJs: true })).toEqual({
    moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
    testMatch: [
      '**/__tests__/**/*.js?(x)',
      '**/?(*.)+(spec|test).js?(x)',
      '**/__tests__/**/*.ts?(x)',
      '**/?(*.)+(spec|test).ts?(x)',
    ],
    transform: {
      '^.+\\.[tj]sx?$': 'ts-jest',
    },
  })
})

it('should be able to use a base config', () => {
  expect(createJestPreset(undefined, {})).toMatchInlineSnapshot(`
Object {
  "moduleFileExtensions": Array [
    "js",
    "json",
    "jsx",
    "node",
    "ts",
    "tsx",
  ],
  "testMatch": Array [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)",
    "**/__tests__/**/*.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)",
  ],
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
    "ts",
    "tsx",
  ],
  "testMatch": Array [
    "foo",
    "**/__tests__/**/*.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)",
  ],
  "transform": Object {
    "^.+\\\\.tsx?$": "ts-jest",
    "foo": "bar",
  },
}
`)
})
