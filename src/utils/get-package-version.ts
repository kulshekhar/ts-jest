/**
 * @internal
 */
export function getPackageVersion(moduleName: string): string | undefined {
  try {
    return require(`${moduleName}/package.json`).version as string
  } catch (err) {}

  return
}
