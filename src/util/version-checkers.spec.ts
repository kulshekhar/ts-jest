// tslint:disable:max-line-length
import { __setup } from './debug'
import * as _pv from './get-package-version'
import { VersionCheckers, VersionChecker } from './version-checkers'
import { mocked } from '../__helpers__/mocks'

const logger = jest.fn()
__setup({ logger })

jest.mock('./get-package-version')

const pv = mocked(_pv)

describeChecker(
  VersionCheckers.jest,
  'jest',
  ['22.1.3', '23.4.5'],
  [undefined, '21.0.0', '24.0.0'],
)
describeChecker(
  VersionCheckers.babelJest,
  'babel-jest',
  ['22.1.3', '23.4.5'],
  [undefined, '21.0.0', '24.0.0'],
)
describeChecker(
  VersionCheckers.babelCoreLegacy,
  'babel-core',
  ['6.1.3', '7.0.0-bridge.0'],
  [undefined, '5.0.0', '7.0.0'],
)
describeChecker(
  VersionCheckers.babelCore,
  '@babel/core',
  ['7.1.3', '7.0.0-beta.56'],
  [undefined, '6.0.0', '8.0.0'],
)
describeChecker(
  VersionCheckers.typescript,
  'typescript',
  ['2.7.0', '3.0.1'],
  [undefined, '2.6.99', '4.0.1'],
)

function describeChecker(
  checker: VersionChecker,
  moduleName: string,
  supportedVersions: string[],
  unsupportedVersions: any[],
) {
  describe(moduleName, () => {
    beforeEach(() => {
      logger.mockClear()
      checker.forget()
    })

    unsupportedVersions.forEach(testVersion => {
      describe(`unsupported version (${testVersion})`, () => {
        beforeEach(() => {
          pv.getPackageVersion.mockImplementation(
            name => (name === moduleName ? testVersion : undefined),
          )
        })

        it(`should log with warn()`, () => {
          checker.warn()
          const warnings = logger.mock.calls.filter(args => args[0] === 'warn')
          expect(warnings).toHaveLength(1)
          expect(warnings[0][2]).toMatch(
            testVersion
              ? 'has not been tested with ts-jest'
              : 'is not installed',
          )
        })
        it(`should log only once with warn()`, () => {
          checker.warn()
          checker.warn()
          expect(
            logger.mock.calls
              .map(args => args[0])
              .filter(lvl => lvl === 'warn'),
          ).toHaveLength(1)
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
          pv.getPackageVersion.mockImplementation(
            name => (name === moduleName ? testVersion : undefined),
          )
        })
        it(`should not log with warn()`, () => {
          checker.warn()
          expect(logger.mock.calls.map(args => args[0])).not.toContain('warn')
        })
        it(`should not throw with raise()`, () => {
          expect(checker.raise).not.toThrow()
        })
      }) // describe supported version
    }) // supported versions loop
  }) // describe module
}
