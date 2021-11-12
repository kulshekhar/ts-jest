import { json as runWithJson } from '../run-jest'

const DIR_NAME = 'test-utils'

test(`successfully runs the tests inside ${DIR_NAME}`, () => {
  const { json } = runWithJson(DIR_NAME, undefined, {
    stripAnsi: true,
  })

  expect(json.success).toBe(true)
})
