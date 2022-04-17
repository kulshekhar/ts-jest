import baseEsmCfg from './jest-esm.config.mjs';

const config = {
  ...baseEsmCfg,
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      ...baseEsmCfg.globals['ts-jest'],
      isolatedModules: true,
    },
  },
}

export default config;
