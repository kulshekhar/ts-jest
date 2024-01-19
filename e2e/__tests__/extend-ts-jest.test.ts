import { json as runWithJson } from '../run-jest'

const DIR = 'extend-ts-jest'

test(`successfully runs the tests inside ${DIR}`, () => {
  const { json } = runWithJson(DIR, undefined, {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  })

  expect(json.success).toBe(true)
  expect(json.numTotalTestSuites).toBe(1)
})
