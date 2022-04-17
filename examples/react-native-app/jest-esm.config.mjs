import baseCfg from './jest.config.js';

const config = {
  ...baseCfg,
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      ...baseCfg.globals['ts-jest'],
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}

export default config;
