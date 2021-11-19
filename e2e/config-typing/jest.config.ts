import type { InitialOptionsTsJest } from 'ts-jest'

const jestCfg: InitialOptionsTsJest = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transform: {
    '^.+.tsx?$': 'ts-jest',
  },
}

export default jestCfg
