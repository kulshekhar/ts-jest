import * as fakers from '../__helpers__/fakers'
import { TsJestConfig, TsJestProgram } from '../types'
import { ParsedCommandLine } from 'typescript'

// tslint:disable-next-line:variable-name
export let __tsConfig: any = {}

export default class TsProgramMock implements TsJestProgram {
  get parsedConfig(): ParsedCommandLine {
    return __tsConfig
  }

  constructor(
    public rootDir: string = fakers.filePath(''),
    public tsJestConfig: TsJestConfig = fakers.tsJestConfig(),
  ) {}

  transpileModule(_: string, source: string) {
    return source
  }
}
