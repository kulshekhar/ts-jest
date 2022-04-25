import { Range, satisfies } from 'semver'

import { getPackageVersion } from './get-package-version'
import { rootLogger } from './logger'
import { Errors, interpolate } from './messages'

const logger = rootLogger.child({ namespace: 'versions' })

/**
 * @internal
 *
 * Don't forget to update peerDependencies in package.json when changing these.
 */
const enum ExpectedVersions {
  Jest = '>=28.0.0 <29',
  TypeScript = '>=4.3 <5',
  BabelJest = '>=28.0.0 <29',
  BabelCore = '>=7.0.0-beta.0 <8',
}

/**
 * @internal
 */
export interface VersionChecker {
  raise: () => boolean | never
  warn: () => boolean
  forget: () => void
}

/**
 * @internal
 */
export const VersionCheckers = {
  jest: createVersionChecker('jest', ExpectedVersions.Jest),
  typescript: createVersionChecker('typescript', ExpectedVersions.TypeScript),
  babelJest: createVersionChecker('babel-jest', ExpectedVersions.BabelJest),
  babelCore: createVersionChecker('@babel/core', ExpectedVersions.BabelCore),
}

type CheckVersionAction = 'warn' | 'throw'

/**
 * @internal
 */
function checkVersion(name: string, expectedRange: string, action?: Exclude<CheckVersionAction, 'throw'>): boolean
// eslint-disable-next-line no-redeclare
function checkVersion(name: string, expectedRange: string, action: 'throw'): true | never
// eslint-disable-next-line no-redeclare
function checkVersion(
  name: string,
  expectedRange: string,
  action: CheckVersionAction | undefined = 'warn',
): boolean | never {
  let success = true
  if (!('TS_JEST_DISABLE_VER_CHECKER' in process.env)) {
    const version = getPackageVersion(name)
    success = !!version && satisfies(version, expectedRange)

    logger.debug(
      {
        actualVersion: version,
        expectedVersion: expectedRange,
      },
      'checking version of %s: %s',
      name,
      success ? 'OK' : 'NOT OK',
    )

    if (!action || success) return success

    const message = interpolate(version ? Errors.UntestedDependencyVersion : Errors.MissingDependency, {
      module: name,
      actualVersion: version || '??',
      expectedVersion: rangeToHumanString(expectedRange),
    })
    if (action === 'warn') {
      logger.warn(message)
    } else if (action === 'throw') {
      logger.fatal(message)
      throw new RangeError(message)
    }
  }

  return success
}

function rangeToHumanString(versionRange: string): string {
  return new Range(versionRange).toString()
}

function createVersionChecker(moduleName: string, expectedVersion: string): VersionChecker {
  let memo: boolean | undefined
  const warn = () => {
    if (memo !== undefined) return memo

    return (memo = checkVersion(moduleName, expectedVersion, 'warn'))
  }
  const raise = () => checkVersion(moduleName, expectedVersion, 'throw')

  return {
    raise,
    warn,
    forget() {
      memo = undefined
    },
  }
}
