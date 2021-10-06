import * as path from 'path'

import * as fs from 'graceful-fs'
import { wrap } from 'jest-snapshot-serializer-raw'

import runJest from '../run-jest'

const DIR = path.resolve(__dirname, '../coverage-report')

test('outputs coverage report with `isolatedModules: false`', () => {
  const { stdout, exitCode } = runJest(DIR, ['--no-cache', '--coverage'], {
    stripAnsi: true,
  })
  const coverageDir = path.join(DIR, 'coverage')

  // - the `setup.js` file is ignored and should not be in the coverage report.
  // - `SumDependency.js` is mocked and the real module is never required but
  //  is listed with 0 % coverage.
  // - `notRequiredInTestSuite.js` is not required but it is listed
  //  with 0 % coverage.
  expect(wrap(stdout)).toMatchSnapshot()

  expect(() => fs.accessSync(coverageDir, fs.constants.F_OK)).not.toThrow()
  expect(exitCode).toBe(0)
})

test('outputs coverage report with `isolatedModules: true`', () => {
  const { stdout, exitCode } = runJest(DIR, ['--no-cache', '--coverage', '-c=jest-isolated.config.js'], {
    stripAnsi: true,
  })
  const coverageDir = path.join(DIR, 'coverage')

  // - the `setup.js` file is ignored and should not be in the coverage report.
  // - `SumDependency.js` is mocked and the real module is never required but
  //  is listed with 0 % coverage.
  // - `notRequiredInTestSuite.js` is not required but it is listed
  //  with 0 % coverage.
  expect(wrap(stdout)).toMatchSnapshot()

  expect(() => fs.accessSync(coverageDir, fs.constants.F_OK)).not.toThrow()
  expect(exitCode).toBe(0)
})
