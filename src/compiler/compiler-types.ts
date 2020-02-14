import { TypeInfo } from '../types'

/**
 * Internal source output.
 */
export type SourceOutput = [string, string]

export interface MemoryCacheV2 {
  contents: Map<string, string | undefined>
  versions: Map<string, number>
  outputs: Map<string, string>
}

export interface CompileResult {
  getOutput: (code: string, fileName: string) => SourceOutput
  getTypeInfo: (code: string, fileName: string, position: number) => TypeInfo
}
