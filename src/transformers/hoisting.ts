// tslint:disable:curly
import TsProgram from '../ts-program'
import importer from '../utils/importer'
import { ImportReasons } from '../utils/messages'
// take care of including ONLY TYPES here, for the rest use ts
import {
  Node,
  ExpressionStatement,
  TransformationContext,
  SourceFile,
  Statement,
  Visitor,
  Block,
  Transformer,
} from 'typescript'

const ts = importer.typeScript(ImportReasons.tsJest)

function isJestMockCallExpression(node: Node): node is ExpressionStatement {
  return (
    ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) &&
    ts.isPropertyAccessExpression(node.expression.expression) &&
    ts.isIdentifier(node.expression.expression.expression) &&
    node.expression.expression.expression.text === 'jest' &&
    ts.isIdentifier(node.expression.expression.name) &&
    node.expression.expression.name.text === 'mock'
  )
}

export default function hoisting(prog: TsProgram) {
  function createVisitor(ctx: TransformationContext, sf: SourceFile) {
    let level = 0
    const hoisted: Statement[][] = []
    const enter = () => {
      level++
      // reuse arrays
      if (hoisted[level]) {
        hoisted[level].splice(0, hoisted[level].length)
      }
    }
    const exit = () => level--
    const hoist = (node: Statement) => {
      if (hoisted[level]) {
        hoisted[level].push(node)
      } else {
        hoisted[level] = [node]
      }
    }

    const visitor: Visitor = node => {
      enter()
      const resultNode = ts.visitEachChild(node, visitor, ctx)
      if (hoisted[level] && hoisted[level].length) {
        ;(resultNode as Block).statements = ts.createNodeArray([
          ...hoisted[level],
          ...(resultNode as Block).statements,
        ])
      }
      exit()

      if (isJestMockCallExpression(resultNode)) {
        hoist(resultNode as Statement)
        return
      }
      return resultNode
    }
    return visitor
  }

  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return (sf: SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf))
  }
}
