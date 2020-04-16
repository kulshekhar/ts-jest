export enum PackageSets {
  default = 'default',
  babel7 = 'with-babel-7',
  babel7StringConfig = 'with-babel-7-string-config',
  // invalid
  unsupportedVersion = 'with-unsupported-version',
}
export const allValidPackageSets = [PackageSets.default, PackageSets.babel7, PackageSets.babel7StringConfig]
export const allPackageSetsWithPreset = [PackageSets.default, PackageSets.babel7, PackageSets.babel7StringConfig]
export const allPackageSetsWithProgram = [PackageSets.default, PackageSets.babel7, PackageSets.babel7StringConfig]
