import { TransformOptions, TransformedSource } from '@jest/transform/build/types'
import { Config } from '@jest/types'

import ProcessedSource from '../../../src/__helpers__/processed-source'

// tslint:disable-next-line:no-default-export
export default class ProcessedFileIo extends ProcessedSource {
  constructor(
    cwd: string,
    filename: string,
    readonly input: [string, Config.Path, Config.ProjectConfig, TransformOptions],
    output: string | TransformedSource,
  ) {
    super(typeof output === 'string' ? output : output.code, filename, cwd)
  }
  get inputCode(): string {
    return this.input[0]
  }
  get inputPath(): string {
    return this.input[1]
  }
}
