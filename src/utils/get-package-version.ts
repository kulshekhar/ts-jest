/**
 * @internal
 */
export function getPackageVersion(moduleName: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`${moduleName}/package.json`).version as string
  } catch {}

  return
}
