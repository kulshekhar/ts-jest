# Transformer

See https://dev.doctorevidence.com/how-to-write-a-typescript-transform-plugin-fc5308fdd943

## Boilerplate

```ts
import {
  TransformationContext,
  SourceFile,
  Visitor,
  visitEachChild,
  Transformer,
  visitNode,
} from 'typescript';
import TsProgram from '../ts-program';

export default function(prog: TsProgram) {
  function createVisitor(ctx: TransformationContext, sf: SourceFile) {
    const visitor: Visitor = node => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      return visitEachChild(node, visitor, ctx);
    };
    return visitor;
  }
  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return (sf: SourceFile) => visitNode(sf, createVisitor(ctx, sf));
  };
};
```
