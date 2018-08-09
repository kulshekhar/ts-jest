// import {
//   TransformationContext,
//   EmitHint,
//   Node,
//   JsxEmit,
//   SyntaxKind,
//   SourceFile,
//   JsxSelfClosingElement,
//   JsxClosingElement,
//   JsxOpeningElement,
//   Bundle,
//   isPropertyAccessExpression,
//   isPropertyAssignment,
//   PropertyAccessExpression,
//   Expression,
//   createElementAccess,
//   setTextRange,
//   PropertyAssignment,
//   isIdentifier,
//   updatePropertyAssignment,
//   Identifier,
// } from 'typescript';
// import { chainBundle, getOriginalNodeId, getNodeId } from './utilis';

// export default function hoistingTransformer(
//   context: TransformationContext,
// ): (x: SourceFile | Bundle) => SourceFile | Bundle {
//   const compilerOptions = context.getCompilerOptions();

//   // enable emit notification only if using --jsx preserve or react-native
//   let previousOnEmitNode: (hint: EmitHint, node: Node, emitCallback: (hint: EmitHint, node: Node) => void) => void;
//   let noSubstitution: boolean[];

//   if (compilerOptions.jsx === JsxEmit.Preserve || compilerOptions.jsx === JsxEmit.ReactNative) {
//     previousOnEmitNode = context.onEmitNode;
//     context.onEmitNode = onEmitNode;
//     context.enableEmitNotification(SyntaxKind.JsxOpeningElement);
//     context.enableEmitNotification(SyntaxKind.JsxClosingElement);
//     context.enableEmitNotification(SyntaxKind.JsxSelfClosingElement);
//     noSubstitution = [];
//   }

//   const previousOnSubstituteNode = context.onSubstituteNode;
//   context.onSubstituteNode = onSubstituteNode;
//   context.enableSubstitution(SyntaxKind.PropertyAccessExpression);
//   context.enableSubstitution(SyntaxKind.PropertyAssignment);
//   return chainBundle(transformSourceFile);

//   function transformSourceFile(node: SourceFile) {
//     return node;
//   }

//   /**
//    * Called by the printer just before a node is printed.
//    *
//    * @param hint A hint as to the intended usage of the node.
//    * @param node The node to emit.
//    * @param emitCallback A callback used to emit the node.
//    */
//   function onEmitNode(hint: EmitHint, node: Node, emitCallback: (emitContext: EmitHint, node: Node) => void) {
//     switch (node.kind) {
//       case SyntaxKind.JsxOpeningElement:
//       case SyntaxKind.JsxClosingElement:
//       case SyntaxKind.JsxSelfClosingElement:
//         const tagName = (node as JsxOpeningElement | JsxClosingElement | JsxSelfClosingElement).tagName;
//         noSubstitution[getOriginalNodeId(tagName)] = true;
//         break;
//     }

//     previousOnEmitNode(hint, node, emitCallback);
//   }

//   /**
//    * Hooks node substitutions.
//    *
//    * @param hint A hint as to the intended usage of the node.
//    * @param node The node to substitute.
//    */
//   function onSubstituteNode(hint: EmitHint, node: Node) {
//     if (getNodeId(node) && noSubstitution && noSubstitution[getNodeId(node)]) {
//       return previousOnSubstituteNode(hint, node);
//     }

//     node = previousOnSubstituteNode(hint, node);
//     if (isPropertyAccessExpression(node)) {
//       return substitutePropertyAccessExpression(node);
//     } else if (isPropertyAssignment(node)) {
//       return substitutePropertyAssignment(node);
//     }
//     return node;
//   }

//   /**
//    * Substitutes a PropertyAccessExpression whose name is a reserved word.
//    *
//    * @param node A PropertyAccessExpression
//    */
//   function substitutePropertyAccessExpression(node: PropertyAccessExpression): Expression {
//     const literalName = trySubstituteReservedName(node.name);
//     if (literalName) {
//       return setTextRange(createElementAccess(node.expression, literalName), node);
//     }
//     return node;
//   }

//   /**
//    * Substitutes a PropertyAssignment whose name is a reserved word.
//    *
//    * @param node A PropertyAssignment
//    */
//   function substitutePropertyAssignment(node: PropertyAssignment): PropertyAssignment {
//     const literalName = isIdentifier(node.name) && trySubstituteReservedName(node.name);
//     if (literalName) {
//       return updatePropertyAssignment(node, literalName, node.initializer);
//     }
//     return node;
//   }

//   /**
//    * If an identifier name is a reserved word, returns a string literal for the name.
//    *
//    * @param name An Identifier
//    */
//   function trySubstituteReservedName(name: Identifier) {
//     const token = name.originalKeywordKind || (nodeIsSynthesized(name) ? stringToToken(idText(name)) : undefined);
//     if (token !== undefined && token >= SyntaxKind.FirstReservedWord && token <= SyntaxKind.LastReservedWord) {
//       return setTextRange(createLiteral(name), name);
//     }
//     return undefined;
//   }
// }
