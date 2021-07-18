const { LogContexts, LogLevels } = require('bs-logger')

function factory(tsCompiler) {
  const logger = tsCompiler.configSet.logger.child({ namespace: 'hummy-transformer' })
  const ts = tsCompiler.configSet.compilerModule
  function createVisitor(_ctx, _) {
    return (node) => node
  }

  return (ctx) =>
    logger.wrap({ [LogContexts.logLevel]: LogLevels.debug, call: null }, 'visitSourceFileNode(): dummy', (sf) =>
      ts.visitNode(sf, createVisitor(ctx, sf))
    )
}

module.exports = {
  factory,
  version: 1,
}
