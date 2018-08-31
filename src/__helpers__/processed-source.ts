import { RawSourceMap } from 'source-map'
import {
  rewriteSourceMaps,
  relativisePaths,
  parseSource,
  ParsedSourceWithMaps,
} from './source-maps'
import { ROOT } from './path'
import { isAbsolute, relative } from 'path'

// tslint:disable-next-line:no-default-export
export default class ProcessedSource {
  readonly filename: string

  constructor(
    readonly output: string,
    filename: string,
    readonly cwd: string = ROOT,
  ) {
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
    return
  }
  get sourceMapsNormalizer() {
    return (maps: RawSourceMap): RawSourceMap =>
      relativisePaths(maps, this.cwd, '<cwd>/')
  }
}
