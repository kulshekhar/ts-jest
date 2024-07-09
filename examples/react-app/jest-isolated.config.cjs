const baseCfg = require('./jest.config.cjs')
const { createDefaultPreset } = require('ts-jest')

const defaultPreset = createDefaultPreset({
  tsconfig: 'tsconfig.spec.json',
  isolatedModules: true,
})

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseCfg,
  transform: {
    ...baseCfg.transform,
    ...defaultPreset.transform,
  },
}
