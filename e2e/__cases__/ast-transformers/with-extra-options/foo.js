const { LogContexts, LogLevels } = require('bs-logger')

function factory({ configSet }, extraOpts = Object.create(null)) {
  const logger = configSet.logger.child({ namespace: 'dummy-transformer' })
  const ts = configSet.compilerModule
  logger.debug('Dummy transformer with extra options', JSON.stringify(extraOpts))

  function createVisitor(_ctx, _sf) {
    return (node) => node
  }

  return (ctx) =>
    logger.wrap({ [LogContexts.logLevel]: LogLevels.debug, call: null }, 'visitSourceFileNode(): dummy', (sf) =>
      ts.visitNode(sf, createVisitor(ctx, sf))
    )
}

exports.factory = factory
