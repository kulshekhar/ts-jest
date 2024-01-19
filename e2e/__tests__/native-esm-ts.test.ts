import { json as runWithJson } from '../run-jest'

test('runs TS test with native ESM', () => {
  const { exitCode, json } = runWithJson('native-esm-ts', [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  })

  expect(exitCode).toBe(0)
  expect(json.numTotalTests).toBe(4)
  expect(json.numPassedTests).toBe(4)
})
