import { satisfies, Range } from 'semver'
import { warn, debug } from './debug'
import { interpolate, Errors } from './messages'
import { getPackageVersion } from './get-package-version'

export enum ExpectedVersions {
  Jest = '>=22 <24',
  TypeScript = '>=2.7 <4',
  BabelJest = '>=22 <24',
  BabelCoreLegacy = '>=6 <7 || 7.0.0-bridge.0',
  BabelCore = '>=7.0.0-beta.0 <8',
}

export interface VersionChecker {
  raise: () => boolean | never
  warn: () => boolean
  forget: () => void
}

// tslint:disable-next-line:variable-name
export const VersionCheckers = {
  jest: createVersionChecker('jest', ExpectedVersions.Jest),
  typescript: createVersionChecker('typescript', ExpectedVersions.TypeScript),
  babelJest: createVersionChecker('babel-jest', ExpectedVersions.BabelJest),
  babelCoreLegacy: createVersionChecker(
    'babel-core',
    ExpectedVersions.BabelCoreLegacy,
  ),
  babelCore: createVersionChecker('@babel/core', ExpectedVersions.BabelCore),
}

type CheckVersionAction = 'warn' | 'throw'

function checkVersion(
  name: string,
  expectedRange: string,
  action?: Exclude<CheckVersionAction, 'throw'>,
): boolean
function checkVersion(
  name: string,
  expectedRange: string,
  action: 'throw',
): true | never
function checkVersion(
  name: string,
  expectedRange: string,
  action: CheckVersionAction | undefined = 'warn',
): boolean | never {
  const version = getPackageVersion(name)
  const success = !!version && satisfies(version, expectedRange)
  debug('checkVersion', name, success ? 'OK' : 'NOT OK', {
    actual: version,
    expected: expectedRange,
  })
  if (!action || success) return success

  const message = interpolate(
    version ? Errors.UntestedDependencyVersion : Errors.MissingDependency,
    {
      module: name,
      actualVersion: version || '??',
      expectedVersion: rangeToHumanString(expectedRange),
    },
  )
  if (action === 'warn') {
    warn(message)
  } else if (action === 'throw') {
    throw new RangeError(message)
  }
  return success
}

function rangeToHumanString(versionRange: string): string {
  return new Range(versionRange).toString()
}

function createVersionChecker(
  moduleName: string,
  expectedVersion: string,
): VersionChecker {
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
