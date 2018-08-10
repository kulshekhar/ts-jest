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
  isSourceFile,
  NodeArray,
  Statement,
  createNodeArray,
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
    const hoisted: Statement[] = [];

    const visitor: Visitor = node => {
      const resultNode = visitEachChild(node, visitor, ctx);
      if (isSourceFile(resultNode)) {
        resultNode.statements = createNodeArray([
          ...hoisted,
          ...resultNode.statements,
        ]);
      } else if (isJestMockCallExpression(resultNode)) {
        hoisted.push(resultNode);
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
