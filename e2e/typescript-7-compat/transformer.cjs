const ts = require('typescript')

module.exports = {
  name: 'typescript-compatibility-transformer',
  version: 1,
  factory(compiler, options = {}) {
    return (context) => (sourceFile) => {
      if (options.expectProgram && !compiler.program?.getTypeChecker()) {
        throw new Error('Expected the language-service compiler to expose its TypeScript program')
      }

      const visitor = (node) => {
        if (ts.isStringLiteral(node) && node.text === '__ORIGINAL__') {
          return ts.factory.createStringLiteral('__TRANSFORMED__')
        }

        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitNode(sourceFile, visitor)
    }
  },
}
