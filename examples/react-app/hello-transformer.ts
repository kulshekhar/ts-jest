import type { TsCompilerInstance } from 'ts-jest'
import keysTransformer from 'ts-transformer-keys/transformer'
import type { TransformationContext } from 'typescript'

export const version = 1
export const name = 'my-key-transformer'

export function factory(compilerInstance: TsCompilerInstance) {
  return (ctx: TransformationContext) => {
    // @ts-expect-error testing purpose
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return keysTransformer(compilerInstance.program!)(ctx)
  }
}
