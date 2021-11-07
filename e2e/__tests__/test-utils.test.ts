import { json as runWithJson } from '../run-jest'

test('successfully runs the tests inside `test-utils/`', () => {
  const { json } = runWithJson('test-utils', undefined, {
    stripAnsi: true,
  })

  expect(json.success).toBe(true)
})
