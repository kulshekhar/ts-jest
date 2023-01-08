void `
type ModuleResolverOptions = {
  readonly conditions: unknown
  defaultResolver(path: string, options: Readonly<ModuleResolverOptions>): ModuleResolver
  rootDir: unknown

  /** @see {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/resolve/index.d.ts}, interface Opts */
  readonly baseDir: string
  extensions: string | readonly string[] | undefined
  moduleDirectory: string | undefined
  paths: string | readonly string[] | undefined
}

type ModuleResolver = (
  path: string,
  options: Readonly<ModuleResolverOptions>,
) => ModuleResolverOptions['defaultResolver']
`

const mjsResolver /*: ModuleResolver */ = function (path, options) {
  const mjsExtRegex = /\.mjs$/i

  const resolver = options.defaultResolver
  if (mjsExtRegex.test(path)) {
    try {
      return resolver(path.replace(mjsExtRegex, '.mts'), options)
    } catch {
      // use default resolver
    }
  }

  return resolver(path, options)
}

module.exports = mjsResolver
