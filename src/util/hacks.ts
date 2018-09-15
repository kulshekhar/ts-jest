import semver from 'semver'

import { BabelConfig, ModulePatcher, TBabelCore } from '../types'

import { rootLogger } from './logger'

const logger = rootLogger.child({ namespace: 'hacks' })

// tslint:disable-next-line:variable-name
export const patchBabelCore_githubIssue6577: ModulePatcher<TBabelCore> = babel => {
  // There is an issue still open in Babel 6: https://github.com/babel/babel/issues/6577
  // This is a hack to bypass it and fix our issue #627
  // The bug disallow debugging when using Babel Jest with babel-core@6.x because of
  // source-maps not being inlined
  if (typeof babel.version !== 'string') return babel
  const version = semver.coerce(babel.version)
  if (version && version.major === 6) {
    try {
      const File = require('babel-core/lib/transformation/file').File
      File.prototype.initOptions = (original => {
        return function initOptions(this: any, opt: BabelConfig) {
          const before = opt.sourceMaps
          const result = original.apply(this, arguments)
          if (before && before !== result.sourceMaps) {
            result.sourceMaps = before
          }
          return result
        }
      })(File.prototype.initOptions)
      logger.info('patched babel-core/lib/transformation/file')
    } catch (err) {}
  }
  return babel
}
