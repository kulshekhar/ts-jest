/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest/presets/js-with-babel-esm',
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
