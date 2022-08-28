import type { InitialOptionsTsJest } from 'ts-jest'

const jestCfg: InitialOptionsTsJest = {
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
}

export default jestCfg
