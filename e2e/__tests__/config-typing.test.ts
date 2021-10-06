import { json as runWithJson } from '../run-jest'

test('successfully runs the tests inside `config-typing/`', () => {
  const { json } = runWithJson('config-typing')

  expect(json.success).toBe(true)
})
