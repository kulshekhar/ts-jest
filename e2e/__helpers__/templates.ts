export enum PackageSets {
  default = 'default',
  babel6 = 'with-babel-6',
  babel7 = 'with-babel-7',
  jest22 = 'with-jest-22',
  typescript2_7 = 'with-typescript-2-7',
  // invalid
  unsupportedVersion = 'with-unsupported-version',
}
export const allValidPackageSets = [
  PackageSets.default,
  PackageSets.babel6,
  PackageSets.babel7,
  PackageSets.jest22,
  PackageSets.typescript2_7,
]
export const allPackageSetsWithPreset = [
  PackageSets.default,
  PackageSets.babel6,
  PackageSets.babel7,
  PackageSets.typescript2_7,
]
