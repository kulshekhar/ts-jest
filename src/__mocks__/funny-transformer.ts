import type { SourceFile, TransformerFactory } from 'typescript'

export const version = 1
export const name = 'funny-transformer'
export function factory(): TransformerFactory<SourceFile> {
  return () => {
    return (sf: SourceFile) => {
      return sf
    }
  }
}
