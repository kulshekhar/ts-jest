import type {InitialOptionsTsJest} from 'ts-jest/dist/types'

test('Typings for jest config to support full TypeScript mode', () => {
  const config: InitialOptionsTsJest = {
    globals: {
      'ts-jest': {
        isolatedModules: true,
      }
    },
    verbose: true,
  };

  expect(config).toBeTruthy()
})
