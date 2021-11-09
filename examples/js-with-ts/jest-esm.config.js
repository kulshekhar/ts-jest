/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
