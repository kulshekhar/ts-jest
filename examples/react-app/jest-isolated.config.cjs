const baseCfg = require('./jest.config.cjs')
const { createDefaultPreset } = require('ts-jest')

const defaultPreset = createDefaultPreset({
  tsconfig: 'tsconfig-isolated.spec.json',
})

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseCfg,
  transform: {
    ...baseCfg.transform,
    ...defaultPreset.transform,
  },
}
