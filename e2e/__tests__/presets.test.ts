import { json as runWithJson } from '../run-jest'

test('successfully runs the tests inside `presets/`', () => {
  const { json } = runWithJson('presets')

  expect(json.success).toBe(true)
})
