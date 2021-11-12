import { json as runWithJson } from '../run-jest'

const DIR_NAME = 'config-typing'

test(`successfully runs the tests inside ${DIR_NAME}`, () => {
  const { json } = runWithJson(DIR_NAME)

  expect(json.success).toBe(true)
})
