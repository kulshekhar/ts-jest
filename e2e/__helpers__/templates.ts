export enum PackageSets {
  default = 'default',
  babel7 = 'with-babel-7',
  typescript2_7 = 'with-typescript-2-7',
  // invalid
  unsupportedVersion = 'with-unsupported-version',
}
export const allValidPackageSets = [PackageSets.default, PackageSets.babel7, PackageSets.typescript2_7]
export const allPackageSetsWithPreset = [PackageSets.default, PackageSets.babel7, PackageSets.typescript2_7]
