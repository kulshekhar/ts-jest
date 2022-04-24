const tsJestTransformer = require('../../dist/legacy/ts-jest-transformer')

class FooTransformer extends tsJestTransformer.TsJestTransformer {
  async processAsync(sourceText, sourcePath, transformOptions) {
    return Promise.resolve(this.process(sourceText, sourcePath, transformOptions))
  }
}
module.exports = {
  createTransformer: () => new FooTransformer(),
}
