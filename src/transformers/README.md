# Transformer

See https://dev.doctorevidence.com/how-to-write-a-typescript-transform-plugin-fc5308fdd943

## Boilerplate

```ts
import {
  TransformationContext,
  SourceFile,
  Visitor,
  Transformer,
} from 'typescript';
import { ConfigSet } from '../config-set'

// this is a unique identifier for your transformer
export const name = 'my-transformer'
// increment this each time you change the behavior of your transformer
export const version = 1

export function factory(cs: ConfigSet) {
  const ts = cs.compilerModule
  function createVisitor(ctx: TransformationContext, sf: SourceFile) {
    const visitor: Visitor = node => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      return ts.visitEachChild(node, visitor, ctx)
    };
    return visitor
  }
  // we return the factory expected in CustomTransformers
  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return (sf: SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf))
  }
}
```
