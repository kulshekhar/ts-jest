import { isAbsolute, relative } from 'path'
import { RawSourceMap } from 'source-map'

import { ROOT } from './path'
import { ParsedSourceWithMaps, parseSource, relativisePaths, rewriteSourceMaps } from './source-maps'

export default class ProcessedSource {
  readonly filename: string

  constructor(readonly output: string, filename: string, readonly cwd: string = ROOT) {
    if (isAbsolute(filename)) filename = relative(this.cwd, filename)
    this.filename = filename
  }
  get outputCode(): string {
    return this.output
  }
  get parsedSource(): ParsedSourceWithMaps {
    return parseSource(this.output)
  }
  get outputCodeWithoutMaps(): string {
    return this.parsedSource.source
  }
  get outputSourceMaps(): RawSourceMap | undefined {
    return this.parsedSource.sourceMaps
  }
  get normalizedOutputCode(): string {
    return rewriteSourceMaps(this.output, this.sourceMapsNormalizer)
  }
  get normalizedOutputSourceMaps(): RawSourceMap | undefined {
    const maps = this.outputSourceMaps
    if (maps) return this.sourceMapsNormalizer(maps)

    return undefined
  }
  get sourceMapsNormalizer() {
    return (maps: RawSourceMap): RawSourceMap => relativisePaths(maps, this.cwd, '<cwd>/')
  }
}
