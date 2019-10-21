// tslint:disable:curly
// take care of including ONLY TYPES here, for the rest use `ts`
import { LogContexts, LogLevels } from 'bs-logger'
import {
  Block,
  ExpressionStatement,
  Node,
  SourceFile,
  Statement,
  TransformationContext,
  Transformer,
  Visitor,
} from 'typescript'

import { ConfigSet } from '../config/config-set'

/**
 * What methods of `jest` should we hoist
 */
const HOIST_METHODS = ['mock', 'unmock', 'enableAutomock', 'disableAutomock']

/**
 * @internal
 */
export const name = 'hoisting-jest-mock'
// increment this each time the code is modified
/**
 * @internal
 */
export const version = 1

/**
 * The factory of hoisting transformer factory
 * @param cs Current jest configuration-set
 * @internal
 */
export function factory(cs: ConfigSet) {
  const logger = cs.logger.child({ namespace: 'ts-hoisting' })
  /**
   * Our compiler (typescript, or a module with typescript-like interface)
   */
  const ts = cs.compilerModule

  /**
   * Checks whether given node is a statement that we need to hoist
   * @param node The node to test
   */
  function shouldHoistNode(node: Node): node is ExpressionStatement {
    return (
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isPropertyAccessExpression(node.expression.expression) &&
      ts.isIdentifier(node.expression.expression.expression) &&
      node.expression.expression.expression.text === 'jest' &&
      ts.isIdentifier(node.expression.expression.name) &&
      HOIST_METHODS.includes(node.expression.expression.name.text)
    )
  }

  /**
   * Create a source file visitor which will visit all nodes in a source file
   * @param ctx The typescript transformation context
   * @param sf The owning source file
   */
  function createVisitor(ctx: TransformationContext, _: SourceFile) {
    /**
     * Current block level
     */
    let level = 0
    /**
     * List of nodes which needs to be hoisted, indexed by their owning level
     */
    const hoisted: Statement[][] = []
    /**
     * Called when we enter a block to increase the level
     */
    const enter = () => {
      level++
      // reuse arrays
      if (hoisted[level]) {
        hoisted[level].splice(0, hoisted[level].length)
      }
    }
    /**
     * Called when we leave a block to decrease the level
     */
    const exit = () => level--
    /**
     * Adds a node to the list of nodes to be hoisted in the current level
     * @param node The node to hoist
     */
    const hoist = (node: Statement) => {
      if (hoisted[level]) {
        hoisted[level].push(node)
      } else {
        hoisted[level] = [node]
      }
    }
    /**
     * Our main visitor, which will be called recursively for each node in the source file's AST
     * @param node The node to be visited
     */
    const visitor: Visitor = node => {
      // enter this level
      enter()

      // visit each child
      let resultNode = ts.visitEachChild(node, visitor, ctx)

      // check if we have something to hoist in this level
      if (hoisted[level] && hoisted[level].length) {
        // re-order children so that hoisted ones appear first
        // this is actually the main job of this transformer
        const hoistedStmts = hoisted[level]
        const otherStmts = (resultNode as Block).statements.filter(s => !hoistedStmts.includes(s))
        const newNode = ts.getMutableClone(resultNode) as Block
        newNode.statements = ts.createNodeArray([...hoistedStmts, ...otherStmts])
        resultNode = newNode
      }

      // exit the level
      exit()

      if (shouldHoistNode(resultNode)) {
        // hoist into current level
        hoist(resultNode as Statement)
      }

      // finally returns the currently visited node
      return resultNode
    }
    return visitor
  }

  // returns the transformer factory
  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return logger.wrap(
      { [LogContexts.logLevel]: LogLevels.debug, call: null },
      'visitSourceFileNode(): hoisting',
      (sf: SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf)),
    )
  }
}
