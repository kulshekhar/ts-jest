# Transformer

See https://dev.doctorevidence.com/how-to-write-a-typescript-transform-plugin-fc5308fdd943

## Boilerplate

```ts
import { SourceFile, TransformationContext, Transformer, Visitor } from 'typescript'

import type { TsCompilerInstance } from 'ts-jest/dist/types'

/**
 * Remember to increase the version whenever transformer's content is changed. This is to inform Jest to not reuse
 * the previous cache which contains old transformer's content
 */
export const version = 1
// Used for constructing cache key
export const name = 'hoist-jest'

export function factory(compilerInstance: TsCompilerInstance) {
  const ts = compilerInstance.configSet.compilerModule
  function createVisitor(ctx: TransformationContext, sf: SourceFile) {
    const visitor: Visitor = (node) => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      return ts.visitEachChild(node, visitor, ctx)
    }
    return visitor
  }
  // we return the factory expected in CustomTransformers
  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return (sf: SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf))
  }
}
```
