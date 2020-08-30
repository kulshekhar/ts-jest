import { createJestPreset, TsJestPresets } from './create-jest-preset'

export = {
  get defaults(): TsJestPresets {
    return createJestPreset()
  },
  get jsWithTs(): TsJestPresets {
    return createJestPreset({ allowJs: true })
  },
  get jsWithBabel(): TsJestPresets {
    return createJestPreset(
      { allowJs: false },
      {
        transform: {
          '^.+\\.jsx?$': 'babel-jest',
        },
      },
    )
  },
}
