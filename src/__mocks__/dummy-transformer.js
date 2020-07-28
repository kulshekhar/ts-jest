const { LogContexts, LogLevels } = require('bs-logger')

function factory(cs) {
  const logger = cs.logger.child({ namespace: 'dummy-transformer' })
  const ts = cs.compilerModule

  function createVisitor(_ctx, _) {
    return (node) => node
  }

  return (ctx) =>
    logger.wrap({ [LogContexts.logLevel]: LogLevels.debug, call: null }, 'visitSourceFileNode(): dummy', (sf) =>
      ts.visitNode(sf, createVisitor(ctx, sf))
    )
}

exports.factory = factory
