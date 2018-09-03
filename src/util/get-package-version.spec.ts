import { valid } from 'semver'

import { getPackageVersion } from './get-package-version'

it('should get the version of a package', () => {
  const version = require('../../node_modules/jest/package.json').version
  // ensure the above call doesn't actually fail
  expect(valid(version)).not.toBeNull()
  // real test
  expect(getPackageVersion('jest')).toBe(version)
})

it('should not fail when the package is not installeed', () => {
  expect(getPackageVersion('__foo-bar__')).toBeUndefined()
})
