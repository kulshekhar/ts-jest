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
  globals: {
    aaa: true,
  },
}

export default jestCfg
