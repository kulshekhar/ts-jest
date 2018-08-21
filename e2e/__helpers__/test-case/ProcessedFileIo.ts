import { RawSourceMap } from 'source-map'
import { extractSourceMaps, rewriteSourceMaps, relativisePaths } from '../source-maps'

// tslint:disable-next-line:no-default-export
export default class ProcessedFileIo {
  constructor(
    private _cwd: string,
    readonly filename: string,
    readonly input: [string, jest.Path, jest.ProjectConfig, jest.TransformOptions?],
    readonly output: string | jest.TransformedSource,
  ) { }
  get inputCode(): string { return this.input[0] }
  get inputPath(): string { return this.input[1] }
  get outputCode(): string { return typeof this.output === 'object' ? this.output.code : this.output }
  get outputSourceMaps(): RawSourceMap | undefined { return extractSourceMaps(this.outputCode) }
  get normalizedOutputCode(): string {
    return rewriteSourceMaps(
      this.outputCode,
      this.sourceMapsNormalizer,
    )
  }
  get normalizedOutputSourceMaps(): RawSourceMap | undefined {
    const maps = this.outputSourceMaps
    if (maps) return this.sourceMapsNormalizer(maps)
    return
  }
  get sourceMapsNormalizer() {
    return (maps: RawSourceMap): RawSourceMap => relativisePaths(maps, this._cwd, '<cwd>/')
  }
}
