import { inspect } from 'util'

import { BaseError } from 'make-error'

import { rootLogger } from './logger'
import { Errors, interpolate } from './messages'

const logger = rootLogger.child({ namespace: 'TSError' })

/**
 * @internal
 */
export const INSPECT_CUSTOM = inspect.custom || 'inspect'

/**
 * TypeScript diagnostics error.
 *
 * @internal
 */
export class TSError extends BaseError {
  name = 'TSError'

  constructor(public diagnosticText: string, public diagnosticCodes: number[]) {
    super(
      interpolate(Errors.UnableToCompileTypeScript, {
        diagnostics: diagnosticText.trim(),
      }),
    )
    logger.debug({ diagnosticCodes, diagnosticText }, 'created new TSError')
    // ensure we blacklist any of our code
    Object.defineProperty(this, 'stack', { value: '' })
  }

  /* istanbul ignore next */
  [INSPECT_CUSTOM](): string {
    return this.diagnosticText
  }
}
