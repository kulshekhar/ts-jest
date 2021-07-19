import { LogContexts, LogLevels } from 'bs-logger'
import type {
  Block,
  ExpressionStatement,
  ImportDeclaration,
  Node,
  SourceFile,
  Statement,
  TransformationContext,
  Transformer,
  Visitor,
} from 'typescript'

import type { TsCompilerInstance } from '../types'

/**
 * Remember to increase the version whenever transformer's content is changed. This is to inform Jest to not reuse
 * the previous cache which contains old transformer's content
 */
export const version = 1
// Used for constructing cache key
export const name = 'hoist-jest'

/**
 * What methods of `jest` we should hoist
 */
const HOIST_METHODS = ['mock', 'unmock', 'enableAutomock', 'disableAutomock', 'deepUnmock']
const JEST_GLOBALS_MODULE_NAME = '@jest/globals'
const JEST_GLOBAL_NAME = 'jest'
const ROOT_LEVEL_AST = 1

/**
 * The factory of hoisting transformer factory
 *
 * @internal
 */
export function factory({ configSet }: TsCompilerInstance): (ctx: TransformationContext) => Transformer<SourceFile> {
  const logger = configSet.logger.child({ namespace: 'ts-hoisting' })
  /**
   * Our compiler (typescript, or a module with typescript-like interface)
   * To access Program or TypeChecker, do: cs.tsCompiler.program or cs.tsCompiler.program.getTypeChecker()
   */
  const ts = configSet.compilerModule
  const importNames: string[] = []

  function shouldHoistExpression(node: Node): boolean {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      HOIST_METHODS.includes(node.expression.name.text)
    ) {
      if (importNames.length) {
        // @jest/globals is in used
        return (
          (ts.isIdentifier(node.expression.expression) && importNames.includes(node.expression.expression.text)) ||
          (ts.isPropertyAccessExpression(node.expression.expression) &&
            ts.isIdentifier(node.expression.expression.expression) &&
            importNames.includes(node.expression.expression.expression.text)) ||
          shouldHoistExpression(node.expression.expression)
        )
      } else {
        // @jest/globals is not in used
        return (
          (ts.isIdentifier(node.expression.expression) && node.expression.expression.text === JEST_GLOBAL_NAME) ||
          shouldHoistExpression(node.expression.expression)
        )
      }
    }

    return false
  }

  /**
   * Checks whether given node is a statement that we need to hoist
   */
  function shouldHoistNode(node: Node): node is ExpressionStatement {
    return ts.isExpressionStatement(node) && shouldHoistExpression(node.expression)
  }

  function isJestGlobalImport(node: Node): node is ImportDeclaration {
    return (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === JEST_GLOBALS_MODULE_NAME
    )
  }

  /**
   * Create a source file visitor which will visit all nodes in a source file
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
     *
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
     */
    const visitor: Visitor = (node) => {
      // enter this level
      enter()

      // visit each child
      let resultNode = ts.visitEachChild(node, visitor, ctx)
      /**
       * Gather all possible import names, from different types of import syntax including:
       * - named import, e.g. `import { jest } from '@jest/globals'`
       * - aliased named import, e.g. `import {jest as aliasedJest} from '@jest/globals'`
       * - namespace import, e.g `import * as JestGlobals from '@jest/globals'`
       */
      if (
        isJestGlobalImport(resultNode) &&
        resultNode.importClause?.namedBindings &&
        (ts.isNamespaceImport(resultNode.importClause.namedBindings) ||
          ts.isNamedImports(resultNode.importClause.namedBindings))
      ) {
        const { namedBindings } = resultNode.importClause
        const jestImportName = ts.isNamespaceImport(namedBindings)
          ? namedBindings.name.text
          : namedBindings.elements.find(
              (element) => element.name.text === JEST_GLOBAL_NAME || element.propertyName?.text === JEST_GLOBAL_NAME,
            )?.name.text
        if (jestImportName) {
          importNames.push(jestImportName)
        }
      }
      // check if we have something to hoist in this level
      if (hoisted[level] && hoisted[level].length) {
        // re-order children so that hoisted ones appear first
        // this is actually the main job of this transformer
        const hoistedStmts = hoisted[level]
        const otherStmts = (resultNode as Block).statements.filter(
          (s) => !hoistedStmts.includes(s) && !isJestGlobalImport(s),
        )
        const newNode = ts.getMutableClone(resultNode) as Block
        const newStatements = [...hoistedStmts, ...otherStmts]
        if (level === ROOT_LEVEL_AST) {
          const jestGlobalsImportStmts = (resultNode as Block).statements.filter((s) => isJestGlobalImport(s))
          // jest methods should not be hoisted higher than import `@jest/globals`
          resultNode = {
            ...newNode,
            statements: ts.createNodeArray([...jestGlobalsImportStmts, ...newStatements]),
          } as Statement
        } else {
          resultNode = {
            ...newNode,
            statements: ts.createNodeArray(newStatements),
          } as Statement
        }
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
  return (ctx: TransformationContext): Transformer<SourceFile> =>
    logger.wrap(
      { [LogContexts.logLevel]: LogLevels.debug, call: null },
      'visitSourceFileNode(): hoisting',
      (sf: SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf)),
    )
}
