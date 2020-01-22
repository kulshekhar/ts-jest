export enum PackageSets {
  default = 'default',
  babel7 = 'with-babel-7',
  babel7StringConfig = 'with-babel-7-string-config',
  typescript2_7 = 'with-typescript-2-7',
  // invalid
  unsupportedVersion = 'with-unsupported-version',
}
export const allValidPackageSets = [PackageSets.default, PackageSets.babel7, PackageSets.babel7StringConfig, PackageSets.typescript2_7]
export const allPackageSetsWithPreset = [PackageSets.default, PackageSets.babel7, PackageSets.babel7StringConfig, PackageSets.typescript2_7]
