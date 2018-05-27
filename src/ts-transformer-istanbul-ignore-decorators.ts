/**
 *
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Ported from https://github.com/facebook/jest/blob/
 * 45db59de5f863a7d5007c7bca925a0fc0b497440/packages/babel-plugin-jest-hoist/src/index.js
 */

import * as ts from 'typescript';

function commentRangeText(sourceText: string, range: ts.CommentRange): string {
  return sourceText.slice(range.pos, range.end);
}

function findTrailingComment(
  sourceText: string,
  node: ts.Node,
  matcher: (text: string, kind: ts.CommentKind) => boolean,
): string | undefined {
  return ts.forEachTrailingCommentRange(sourceText, node.getEnd(), (pos, end, kind) => {
    const text = sourceText.slice(pos, end);
    return matcher(text, kind) ? text : undefined;
  });
}

const reIstanbulIgnoreDecorator = /^\/\*\s*istanbul\s*ignore\s*decorator.*\*\/$/;

export function istanbulIgnoreTransformerFactory(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const ignoreAllDecorators = false;
  const ignoreAnnotatedDecorators = true;
  return transformer;

  function transformer(file: ts.SourceFile): ts.SourceFile {
    if (!ignoreAllDecorators && !ignoreAnnotatedDecorators) { return file; }

    const sourceText = file.text;

    return ts.visitEachChild(file, (childNode) => visitNode(childNode, context), context);

    /** Visit each node to see if it's a decorator invocation */
    function visitNode(node: ts.Node, ctx: ts.TransformationContext): ts.Node {
      if (node.kind === ts.SyntaxKind.Decorator) {
        if (
          ignoreAllDecorators ||
          findTrailingComment(sourceText, node, (comment) => reIstanbulIgnoreDecorator.test(comment))
        ) {
          /*
           * Generate this expression to replace the decorator's expression:
           * (
           *   function decoratorWrapperFactory(decorator) {
           *     return function decoratorWrapper() {
           *       /* istanbul ignore next * /
           *       return decorator.apply(this, arguments);
           *     }
           *   }( < original decorator expression goes here > )
           * )
           */

          // This decorator must be transformed
          const originalDecorator = node as ts.Decorator;

          // return decorator.apply(this, arguments)
          const returnStatement = ts.createReturn(
            ts.createCall(
              ts.createPropertyAccess(ts.createIdentifier('decorator'), 'apply'),
              undefined,
              [ts.createThis(), ts.createIdentifier('arguments')],
            ),
          );
          // TODO MOVE THIS TO FACTORY INVOCATION EXPRESSION??
          ts.addSyntheticLeadingComment(
            returnStatement,
            ts.SyntaxKind.MultiLineCommentTrivia,
            'istanbul ignore next',
          );
          const wrappedDecoratorExpression = ts.createCall(
            ts.createFunctionExpression(
              undefined, undefined, 'decoratorWrapperFactory', undefined,
              [ts.createParameter(undefined, undefined, undefined, 'decorator')],
              undefined,
              ts.createBlock(
                [
                  ts.createReturn(
                    ts.createFunctionExpression(
                      undefined, undefined, 'decoratorWrapper', undefined, undefined, undefined,
                      ts.createBlock([returnStatement]),
                    ),
                  ),
                ],
              ),
            ),
            undefined,
            [originalDecorator.expression],
          );

          const replacementDecorator = ts.getMutableClone(originalDecorator);
          replacementDecorator.expression = wrappedDecoratorExpression;
          return ts.visitEachChild(replacementDecorator, (childNode) => visitNode(childNode, context), context);
        }
      }
      return ts.visitEachChild(node, (childNode) => visitNode(childNode, context), context);
    }
  }
}
