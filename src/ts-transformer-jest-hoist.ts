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

function invariant(condition, message) {
  if (!condition) {
    throw new Error('ts-transformer-jest-hoist: ' + message);
  }
}

// We allow `jest`, `expect`, `require`, all default Node.js globals and all
// ES2015 built-ins to be used inside of a `jest.mock` factory.
// We also allow variables prefixed with `mock` as an escape-hatch.
const WHITELISTED_IDENTIFIERS = {
  Array: true,
  ArrayBuffer: true,
  Boolean: true,
  DataView: true,
  Date: true,
  Error: true,
  EvalError: true,
  Float32Array: true,
  Float64Array: true,
  Function: true,
  Generator: true,
  GeneratorFunction: true,
  Infinity: true,
  Int16Array: true,
  Int32Array: true,
  Int8Array: true,
  InternalError: true,
  Intl: true,
  JSON: true,
  Map: true,
  Math: true,
  NaN: true,
  Number: true,
  Object: true,
  Promise: true,
  Proxy: true,
  RangeError: true,
  ReferenceError: true,
  Reflect: true,
  RegExp: true,
  Set: true,
  String: true,
  Symbol: true,
  SyntaxError: true,
  TypeError: true,
  URIError: true,
  Uint16Array: true,
  Uint32Array: true,
  Uint8Array: true,
  Uint8ClampedArray: true,
  WeakMap: true,
  WeakSet: true,
  arguments: true,
  console: true,
  expect: true,
  isNaN: true,
  jest: true,
  parseFloat: true,
  parseInt: true,
  require: true,
  undefined: true,
};
Object.keys(global).forEach(name => (WHITELISTED_IDENTIFIERS[name] = true));

const JEST_GLOBAL = { name: 'jest' };
const IDVisitor = {
  ReferencedIdentifier(path) {
    this.ids.add(path);
  },
  blacklist: ['TypeAnnotation'],
};

const disableEnableAutomock = (args: ts.NodeArray<ts.Expression>) =>
  args.length === 0;

const FUNCTIONS = Object.assign(Object.create(null), {
  mock: (args: ts.NodeArray<ts.Expression>) => {
    if (args.length === 1) {
      return ts.isStringLiteral(args[0]) || ts.isLiteralExpression(args[0]);
    } else if (args.length === 2 || args.length === 3) {
      const moduleFactory = args[1];
      invariant(
        ts.isFunctionExpression(moduleFactory),
        'The second argument of `jest.mock` must be an inline function.',
      );

      const ids = new Set<ts.Identifier>();
      const parentScope = moduleFactory.parentPath.scope;
      // Discover all identifiers within moduleFactory
      function visitModuleFactoryIdentifiers(node: ts.Node) {
        if (ts.isIdentifier(node)) {
          ids.add(node);
        }
        ts.forEachChild(node, visitModuleFactoryIdentifiers);
      }
      visitModuleFactoryIdentifiers(moduleFactory);
      for (const id of ids) {
          const name = id.node.name;
          let found = false;
          let scope = id.scope;

          while(scope !== parentScope) {
              if(scope.bindings[name]) {
                  found = true;
                  break;
              }

              scope = scope.parent;
          }

          // If identifier is a reference to something declared *outside* the moduleFactory function...
          if (!found) {
              invariant(
                  (scope.hasGlobal(name) && WHITELISTED_IDENTIFIERS[name]) ||
                  /^mock/.test(name) ||
                  // Allow istanbul's coverage variable to pass.
                  /^(?:__)?cov/.test(name),
                  'The module factory of `jest.mock()` is not allowed to ' +
                  'reference any out-of-scope variables.\n' +
                  'Invalid variable access: ' +
                  name +
                  '\n' +
                  'Whitelisted objects: ' +
                  Object.keys(WHITELISTED_IDENTIFIERS).join(', ') +
                  '.\n' +
                  'Note: This is a precaution to guard against uninitialized mock ' +
                  'variables. If it is ensured that the mock is required lazily, ' +
                  'variable names prefixed with `mock` are permitted.',
              );
          }
      }

      return true;
    }
    return false;
  },

  unmock: (args: ts.NodeArray<ts.Expression>) => args.length === 1 && ts.isStringLiteral(args[0]),
  deepUnmock: (args: ts.NodeArray<ts.Expression>) => args.length === 1 && ts.isStringLiteral(args[0]),

  disableAutomock: disableEnableAutomock,

  enableAutomock: disableEnableAutomock,
});

function shouldHoistStatement(stmt: ts.Statement) {
  if (!ts.isExpressionStatement(stmt)) {
    return false;
  }
  const expr = stmt.expression;
  if (!ts.isCallExpression(expr)) {
    return false;
  }
  const propAccessExpression = expr.expression;
  if (!ts.isPropertyAccessExpression(propAccessExpression)) {
    return false;
  }
  const { expression, name } = propAccessExpression;
  if (!ts.isIdentifier(expression) || !ts.isIdentifier(name)) {
    return false;
  }
  if (expression.getText() !== JEST_GLOBAL.name) {
    return false;
  }
  const validatorFunction = FUNCTIONS[name.getText()];
  if (!validatorFunction) {
    return false;
  }
  return validatorFunction(expr.arguments);
}

export function hoistTransformerFactory(context: ts.TransformationContext) {
  return transformer;
  function transformer(file: ts.SourceFile) {
    const hoistedStatements: ts.Statement[] = [];
    const nonHoistedStatements: ts.Statement[] = [];

    ts.visitEachChild(file, (childNode) => visitSourceFileChild(childNode, context), context);

    if (!hoistedStatements.length) {
      return file;
    }

    // perform hoisting
    const newFile = ts.getMutableClone(file);
    newFile.statements = ts.setTextRange(
      ts.createNodeArray([...hoistedStatements, ...nonHoistedStatements]),
      newFile.statements,
    );
    return newFile;

    /** Visit each direct child of SourceFile to see if it should be hoisted */
    function visitSourceFileChild(childNode: ts.Node, ctx: ts.TransformationContext) {
      const statement = childNode as ts.Statement;
      if (shouldHoistStatement(statement)) {
        hoistedStatements.push(statement);
      } else {
        nonHoistedStatements.push(statement);
      }
      return childNode;
    }
  }
}
