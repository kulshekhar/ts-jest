// tslint:disable:curly
import {
  Node,
  ExpressionStatement,
  isExpressionStatement,
  isCallExpression,
  isPropertyAccessExpression,
  isIdentifier,
  TransformationContext,
  SourceFile,
  Visitor,
  visitEachChild,
  Transformer,
  visitNode,
  Statement,
  createNodeArray,
  Block,
} from 'typescript';
import TsProgram from '../ts-program';

function isJestMockCallExpression(node: Node): node is ExpressionStatement {
  return (
    isExpressionStatement(node) &&
    isCallExpression(node.expression) &&
    isPropertyAccessExpression(node.expression.expression) &&
    isIdentifier(node.expression.expression.expression) &&
    node.expression.expression.expression.text === 'jest' &&
    isIdentifier(node.expression.expression.name) &&
    node.expression.expression.name.text === 'mock'
  );
}

export default function(prog: TsProgram) {
  function createVisitor(ctx: TransformationContext, sf: SourceFile) {
    let level = 0;
    const hoisted: Statement[][] = [];
    const enter = () => {
      level++;
      // reuse arrays
      if (hoisted[level]) {
        hoisted[level].splice(0, hoisted[level].length);
      }
    };
    const exit = () => level--;
    const hoist = (node: Statement) => {
      if (hoisted[level]) {
        hoisted[level].push(node);
      } else {
        hoisted[level] = [node];
      }
    };

    const visitor: Visitor = node => {
      enter();
      const resultNode = visitEachChild(node, visitor, ctx);
      if (hoisted[level] && hoisted[level].length) {
        (resultNode as Block).statements = createNodeArray([
          ...hoisted[level],
          ...(resultNode as Block).statements,
        ]);
      }
      exit();

      if (isJestMockCallExpression(resultNode)) {
        hoist(resultNode as Statement);
        return;
      }
      return resultNode;
    };
    return visitor;
  }

  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return (sf: SourceFile) => visitNode(sf, createVisitor(ctx, sf));
  };
}
