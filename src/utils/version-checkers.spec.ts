import { logTargetMock } from '../__helpers__/mocks'

import * as _pv from './get-package-version'
import { mocked } from './testing'
import { VersionChecker, VersionCheckers } from './version-checkers'

const logTarget = logTargetMock()

beforeEach(() => {
  logTarget.clear()
})

jest.mock('./get-package-version')

const pv = mocked(_pv)

describeChecker(VersionCheckers.jest, 'jest', ['27.0.0-next.7'], [undefined, '23.6.0', '24.1.0', '28.0.0'])
describeChecker(VersionCheckers.babelJest, 'babel-jest', ['27.0.0-next.7'], [undefined, '23.6.0', '24.1.0', '28.0.0'])
describeChecker(VersionCheckers.babelCore, '@babel/core', ['7.0.0'], [undefined, '6.0.0', '8.0.0'])
describeChecker(VersionCheckers.typescript, 'typescript', ['3.8.0', '3.8.3'], [undefined, '3.3.0', '5.0.0'])

function describeChecker(
  checker: VersionChecker,
  moduleName: string,
  supportedVersions: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsupportedVersions: any[],
) {
  describe(moduleName, () => {
    beforeEach(() => {
      checker.forget()
    })

    unsupportedVersions.forEach((testVersion: string) => {
      describe(`unsupported version (${testVersion})`, () => {
        beforeEach(() => {
          pv.getPackageVersion.mockImplementation((name) => (name === moduleName ? testVersion : undefined))
        })

        it('should log with warn()', () => {
          checker.warn()
          const warnings = logTarget.messages.warn
          expect(warnings).toHaveLength(1)
          expect(warnings[0].message).toMatch(testVersion ? 'has not been tested with ts-jest' : 'is not installed')
        })

        it('should log only once with warn()', () => {
          checker.warn()
          checker.warn()
          expect(logTarget.messages.warn).toHaveLength(1)
        })

        it('should throw with raise()', () => {
          expect(checker.raise).toThrow()
          // adds another time as it should throw all the time even if already called
          expect(checker.raise).toThrow()
        })

        it('should not log or throw when TS_JEST_DISABLE_VER_CHECKER is set in process.env', () => {
          process.env.TS_JEST_DISABLE_VER_CHECKER = 'true'

          checker.warn()

          expect(logTarget.messages.warn).toHaveLength(0)
          expect(checker.raise).not.toThrow()

          delete process.env.TS_JEST_DISABLE_VER_CHECKER
        })
      }) // describe unsupported version
    }) // unsupported versions loop

    supportedVersions.forEach((testVersion) => {
      describe(`supported version (${testVersion})`, () => {
        beforeEach(() => {
          pv.getPackageVersion.mockImplementation((name) => (name === moduleName ? testVersion : undefined))
        })

        it('should not log with warn()', () => {
          checker.warn()
          expect(logTarget.messages.warn).toHaveLength(0)
        })

        it('should not throw with raise()', () => {
          expect(checker.raise).not.toThrow()
        })
      }) // describe supported version
    }) // supported versions loop
  }) // describe module
}
