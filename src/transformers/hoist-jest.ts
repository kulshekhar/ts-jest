import type { Jest } from '@jest/environment'
import { LogContexts, LogLevels } from 'bs-logger'
import type _ts from 'typescript'

import type { TsCompilerInstance } from '../types'

/**
 * Remember to increase the version whenever transformer's content is changed. This is to inform Jest to not reuse
 * the previous cache which contains old transformer's content
 */
export const version = 4
// Used for constructing cache key
export const name = 'hoist-jest'

type HoistedMethod = keyof Pick<Jest, 'mock' | 'unmock' | 'enableAutomock' | 'disableAutomock' | 'deepUnmock'>

const HOIST_METHODS: HoistedMethod[] = ['mock', 'unmock', 'enableAutomock', 'disableAutomock', 'deepUnmock']
const JEST_GLOBALS_MODULE_NAME = '@jest/globals'
const JEST_GLOBAL_NAME = 'jest'

export function factory({ configSet }: TsCompilerInstance) {
  const logger = configSet.logger.child({ namespace: name })
  const ts = configSet.compilerModule
  const importNamesOfJestObj: string[] = []

  const isJestGlobalImport = (node: _ts.Node): node is _ts.ImportDeclaration => {
    return (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === JEST_GLOBALS_MODULE_NAME
    )
  }

  const shouldHoistExpression = (node: _ts.Node): node is _ts.ExpressionStatement => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      HOIST_METHODS.includes(node.expression.name.text as HoistedMethod)
    ) {
      if (importNamesOfJestObj.length) {
        // @jest/globals is in used
        return (
          (ts.isIdentifier(node.expression.expression) &&
            importNamesOfJestObj.includes(node.expression.expression.text)) ||
          (ts.isPropertyAccessExpression(node.expression.expression) &&
            ts.isIdentifier(node.expression.expression.expression) &&
            importNamesOfJestObj.includes(node.expression.expression.expression.text)) ||
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
  const isHoistableStatement = (node: _ts.Node): node is _ts.ExpressionStatement => {
    return ts.isExpressionStatement(node) && shouldHoistExpression(node.expression)
  }

  const canHoistInBlockScope = (node: _ts.Block): node is _ts.Block =>
    !!node.statements.find(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.find(
          (decl) => ts.isIdentifier(decl.name) && decl.name.text !== JEST_GLOBAL_NAME,
        ) &&
        node.statements.find((stmt) => isHoistableStatement(stmt)),
    )

  /**
   * Sort statements according to priority
   * - Import Jest object from `@jest/globals`
   * - Hoistable methods
   * - Non-hoistable methods
   */
  const sortStatements = (statements: _ts.Statement[]): _ts.Statement[] => {
    if (statements.length <= 1) {
      return statements
    }

    return statements.sort((stmtA, stmtB) =>
      isJestGlobalImport(stmtA) ||
      (isHoistableStatement(stmtA) && !isHoistableStatement(stmtB) && !isJestGlobalImport(stmtB))
        ? -1
        : 1,
    )
  }

  const createVisitor = (ctx: _ts.TransformationContext, _: _ts.SourceFile) => {
    const visitor: _ts.Visitor = (node) => {
      const resultNode = ts.visitEachChild(node, visitor, ctx)
      // Since we use `visitEachChild`, we go upwards tree so all children node elements are checked first
      if (ts.isBlock(resultNode) && canHoistInBlockScope(resultNode)) {
        const newNodeArrayStatements = ts.factory.createNodeArray(
          sortStatements(resultNode.statements as unknown as _ts.Statement[]),
        )

        return ts.factory.updateBlock(resultNode, newNodeArrayStatements)
      } else {
        if (ts.isSourceFile(resultNode)) {
          resultNode.statements.forEach((stmt) => {
            /**
             * Gather all possible import names, from different types of import syntax including:
             * - named import, e.g. `import { jest } from '@jest/globals'`
             * - aliased named import, e.g. `import {jest as aliasedJest} from '@jest/globals'`
             * - namespace import, e.g `import * as JestGlobals from '@jest/globals'`
             */
            if (
              isJestGlobalImport(stmt) &&
              stmt.importClause?.namedBindings &&
              (ts.isNamespaceImport(stmt.importClause.namedBindings) ||
                ts.isNamedImports(stmt.importClause.namedBindings))
            ) {
              const { namedBindings } = stmt.importClause
              const jestImportName = ts.isNamespaceImport(namedBindings)
                ? namedBindings.name.text
                : namedBindings.elements.find(
                    (element) =>
                      element.name.text === JEST_GLOBAL_NAME || element.propertyName?.text === JEST_GLOBAL_NAME,
                  )?.name.text
              if (jestImportName) {
                importNamesOfJestObj.push(jestImportName)
              }
            }
          })
          const newNodeArrayStatements = ts.factory.createNodeArray(
            sortStatements(resultNode.statements as unknown as _ts.Statement[]),
          )
          importNamesOfJestObj.length = 0

          return ts.factory.updateSourceFile(
            resultNode,
            newNodeArrayStatements,
            resultNode.isDeclarationFile,
            resultNode.referencedFiles,
            resultNode.typeReferenceDirectives,
            resultNode.hasNoDefaultLib,
            resultNode.libReferenceDirectives,
          )
        }

        return resultNode
      }
    }

    return visitor
  }

  // returns the transformer factory
  return (ctx: _ts.TransformationContext): _ts.Transformer<_ts.SourceFile> =>
    logger.wrap({ [LogContexts.logLevel]: LogLevels.debug, call: null }, 'visitSourceFileNode(): hoist jest', (sf) =>
      ts.visitNode(sf, createVisitor(ctx, sf)),
    )
}
