import type { InitialOptionsTsJest } from '../../../dist/types'

test('should expose TypeScript types for Jest config', () => {
  const config: InitialOptionsTsJest = {
    globals: {
      'ts-jest': {
        isolatedModules: true,
      },
    },
    verbose: true,
  }

  expect(config).toBeTruthy()
})
