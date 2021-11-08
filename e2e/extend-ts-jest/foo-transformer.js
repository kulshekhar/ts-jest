const tsJestTransformer = require('../../dist/ts-jest-transformer')

class FooTransformer extends tsJestTransformer.TsJestTransformer {
  async processAsync(sourceText, sourcePath, transformOptions) {
    return new Promise((resolve) => resolve(this.process(sourceText, sourcePath, transformOptions)))
  }
}
module.exports = {
  createTransformer: () => new FooTransformer(),
}
