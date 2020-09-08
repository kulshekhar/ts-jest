import presets from './index'

describe('presets', () => {
  test.each([presets.defaults, presets.jsWithTs, presets.jsWithBabel])(
    'should return correct preset data',
    (presetData) => {
      expect(presetData).toMatchSnapshot()
    },
  )
})
