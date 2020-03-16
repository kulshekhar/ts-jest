// tslint:disable:max-line-length
import { mocked } from '../../utils'
import { logTargetMock } from '../__helpers__/mocks'

import * as _pv from './get-package-version'
import { VersionChecker, VersionCheckers } from './version-checkers'

const logTarget = logTargetMock()

beforeEach(() => {
  logTarget.clear()
})

jest.mock('./get-package-version')

const pv = mocked(_pv)

describeChecker(VersionCheckers.jest, 'jest', ['25.0.0'], [undefined, '23.6.0', '24.1.0', '26.0.0'])
describeChecker(VersionCheckers.babelJest, 'babel-jest', ['25.0.0'], [undefined, '23.6.0', '24.1.0', '26.0.0'])
describeChecker(VersionCheckers.babelCore, '@babel/core', ['7.0.0'], [undefined, '6.0.0', '8.0.0'])
describeChecker(VersionCheckers.typescript, 'typescript', ['2.7.0', '3.0.1'], [undefined, '2.6.99', '4.0.1'])

function describeChecker(
  checker: VersionChecker,
  moduleName: string,
  supportedVersions: string[],
  unsupportedVersions: any[],
) {
  describe(moduleName, () => {
    beforeEach(() => {
      checker.forget()
    })

    unsupportedVersions.forEach(testVersion => {
      describe(`unsupported version (${testVersion})`, () => {
        beforeEach(() => {
          pv.getPackageVersion.mockImplementation(name => (name === moduleName ? testVersion : undefined))
        })

        it(`should log with warn()`, () => {
          checker.warn()
          const warnings = logTarget.messages.warn
          expect(warnings).toHaveLength(1)
          expect(warnings[0].message).toMatch(testVersion ? 'has not been tested with ts-jest' : 'is not installed')
        })
        it(`should log only once with warn()`, () => {
          checker.warn()
          checker.warn()
          expect(logTarget.messages.warn).toHaveLength(1)
        })
        it(`should throw with raise()`, () => {
          expect(checker.raise).toThrow()
          // adds another time as it should throw all the time even if already called
          expect(checker.raise).toThrow()
        })
      }) // describe unsupported version
    }) // unsupported versions loop

    supportedVersions.forEach(testVersion => {
      describe(`supported version (${testVersion})`, () => {
        beforeEach(() => {
          pv.getPackageVersion.mockImplementation(name => (name === moduleName ? testVersion : undefined))
        })
        it(`should not log with warn()`, () => {
          checker.warn()
          expect(logTarget.messages.warn).toHaveLength(0)
        })
        it(`should not throw with raise()`, () => {
          expect(checker.raise).not.toThrow()
        })
      }) // describe supported version
    }) // supported versions loop
  }) // describe module
}
