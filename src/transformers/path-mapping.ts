/**
 * This transformer is heavily inspired from:
 * - https://github.com/LeDDGroup/typescript-transform-paths
 * - https://github.com/dropbox/ts-transform-import-path-rewrite
 * Thank you: @longlho, @LeddGroup for all the great works
 */
import { LogContexts, LogLevels } from 'bs-logger'
import { basename, dirname, isAbsolute, join, normalize, relative } from 'path'
import type * as _ts from 'typescript'

import type { ConfigSet } from '../config/config-set'

/**
 * @internal
 */
export const name = 'path-mapping'
// increment this each time the code is modified
/**
 * @internal
 */
export const version = 1

const isBaseDir = (base: string, dir: string) => !relative(base, dir)?.startsWith('.')

/**
 * The factory of import path alias transformer factory.
 */
export function factory(cs: ConfigSet): (ctx: _ts.TransformationContext) => _ts.Transformer<_ts.SourceFile> {
  const logger = cs.logger.child({ namespace: 'ts-path-mapping' })
  const ts = cs.compilerModule
  const compilerOptions = cs.parsedTsConfig.options
  const rootDirs = compilerOptions.rootDirs?.filter(isAbsolute)

  const isDynamicImport = (node: _ts.Node): node is _ts.CallExpression =>
    ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
  const isRequire = (node: _ts.Node): node is _ts.CallExpression =>
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'require' &&
    ts.isStringLiteral(node.arguments[0]) &&
    node.arguments.length === 1

  const createVisitor = (ctx: _ts.TransformationContext, sf: _ts.SourceFile) => {
    const { fileName } = sf
    const fileDir = normalize(dirname(fileName))
    const rewritePath = (importPath: string): string => {
      let p = importPath
      const { resolvedModule } = ts.resolveModuleName(importPath, fileName, compilerOptions, ts.sys)
      if (resolvedModule) {
        const { resolvedFileName } = resolvedModule
        let filePath = fileDir
        let modulePath = dirname(resolvedFileName)
        /* Handle rootDirs mapping */
        if (rootDirs) {
          let fileRootDir = ''
          let moduleRootDir = ''
          for (const rootDir of rootDirs) {
            if (isBaseDir(rootDir, resolvedFileName) && rootDir.length > moduleRootDir.length) moduleRootDir = rootDir
            if (isBaseDir(rootDir, fileName) && rootDir.length > fileRootDir.length) fileRootDir = rootDir
          }
          /* Remove base dirs to make relative to root */
          if (fileRootDir && moduleRootDir) {
            filePath = relative(fileRootDir, filePath)
            modulePath = relative(moduleRootDir, modulePath)
          }
        }
        p = normalize(join(relative(filePath, modulePath), basename(resolvedFileName)))
        p = p.startsWith('.') ? p : `./${p}`
      }

      return p
    }
    const visitor: _ts.Visitor = (node) => {
      let rewrittenPath: string | undefined
      const newNode = ts.getMutableClone(node)
      /**
       * e.g.
       * - import('@utils/json')
       * - const { stringify } = require('@utils/json')
       */
      if (isDynamicImport(node) || isRequire(node)) {
        rewrittenPath = rewritePath((node.arguments[0] as _ts.StringLiteral).text)

        return {
          ...newNode,
          arguments: ts.createNodeArray([ts.createStringLiteral(rewrittenPath)]),
        }
      }
      // legacy import, e.g. import foo = require('@utils/json')
      if (ts.isExternalModuleReference(node) && ts.isStringLiteral(node.expression)) {
        rewrittenPath = rewritePath(node.expression.text)

        return ts.updateExternalModuleReference(newNode as _ts.ExternalModuleReference, ts.createLiteral(rewrittenPath))
      }
      /**
       * e.g.
       * - import { parse } from '@utils/json'
       * - import * as json from '@utils/json'
       */
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        rewrittenPath = rewritePath(node.moduleSpecifier.text)

        return {
          ...newNode,
          moduleSpecifier: ts.createLiteral(rewrittenPath),
        }
      }
      // e.g. export * as jsonUtils from '@utils/json'
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        rewrittenPath = rewritePath(node.moduleSpecifier.text)

        return {
          ...newNode,
          moduleSpecifier: ts.createLiteral(rewrittenPath),
        }
      }
      // 3.8 import type, e.g. import type { Foo } from '@utils/json'
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      ) {
        // `.text` instead of `getText` bc this node doesn't map to sf (it's generated d.ts)
        rewrittenPath = rewritePath(node.argument.literal.text)

        return {
          ...newNode,
          argument: ts.createLiteralTypeNode(ts.createStringLiteral(rewrittenPath)),
        }
      }

      return ts.visitEachChild(node, visitor, ctx)
    }

    return visitor
  }

  // returns the transformer factory
  return (ctx: _ts.TransformationContext): _ts.Transformer<_ts.SourceFile> =>
    logger.wrap(
      { [LogContexts.logLevel]: LogLevels.debug, call: null },
      'visitSourceFileNode(): path mapping',
      (sf: _ts.SourceFile) => ts.visitNode(sf, createVisitor(ctx, sf)),
    )
}
