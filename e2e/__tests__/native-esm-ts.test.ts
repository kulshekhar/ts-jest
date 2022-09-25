import { onNodeVersions, json as runWithJson } from '../run-jest'

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=14.15.0', () => {
  test('runs TS test with native ESM', () => {
    const { exitCode, json } = runWithJson('native-esm-ts', [], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    })

    expect(exitCode).toBe(0)
    expect(json.numTotalTests).toBe(4)
    expect(json.numPassedTests).toBe(4)
  })
})
