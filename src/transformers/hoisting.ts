// tslint:disable:curly
// take care of including ONLY TYPES here, for the rest use `ts`
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
import { ConfigSet } from '../config/config-set'

/**
 * What methods of `jest` should we hoist
 */
const HOIST_METHODS = ['mock', 'unmock']

/**
 * The factory of hoisting transformer factory
 * @param cs Current jest configuration-set
 */
export function factory(cs: ConfigSet) {
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
  function createVisitor(ctx: TransformationContext, sf: SourceFile) {
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
     * Called when we leave a block to devrease the level
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
      const resultNode = ts.visitEachChild(node, visitor, ctx)

      // check if we have something to hoist in this level
      if (hoisted[level] && hoisted[level].length) {
        // re-order children so that hoisted ones appear first
        // this is actually the main work of this transformer
        const block = resultNode as Block
        block.statements = ts.createNodeArray([
          ...hoisted[level],
          ...block.statements,
        ])
      }

      // exit the level
      exit()

      if (shouldHoistNode(resultNode)) {
        // hoist into current level
        hoist(resultNode as Statement)
        return
      }

      // finsally returns the currently visited node
      return resultNode
    }
    return visitor
  }

  // returns the transformer factory
  return (ctx: TransformationContext): Transformer<SourceFile> => {
    return (sf: SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf))
  }
}
