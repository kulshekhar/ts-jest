import { sync as spawnSync } from 'execa'
import stripAnsi from 'strip-ansi'

describe('source-map', () => {
  it('should display failed test with stacktrace', () => {
    // Use `--json` flag to ignore differences between OS when creating snapshots
    const { stdout } = spawnSync('jest', ['-c=e2e/source-map/src/jest-fake.config.js', '--json'], {
      cwd: process.cwd(),
      reject: false,
    })

    const message = JSON.parse(stdout || '').testResults[0].message

    expect(stripAnsi(message)).toMatchSnapshot()
  })
})
