import type { JestConfigWithTsJest } from '../../dist'

const jestCfg: JestConfigWithTsJest = {
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
