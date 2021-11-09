import { json as runWithJson, onNodeVersions } from '../run-jest'

const DIR = 'extend-ts-jest'

// Only need to test in ESM because ESM makes `this` context become `undefined`
onNodeVersions('>=12.16.0', () => {
  test(`successfully runs the tests inside ${DIR}`, () => {
    const { json } = runWithJson(DIR, undefined, {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    })

    expect(json.success).toBe(true)
    expect(json.numTotalTestSuites).toBe(1)
  })
})
