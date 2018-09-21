import { AstTransformerDesc } from '../types'

import * as hoisting from './hoist-jest'

/**
 * @internal
 */
export const internals: AstTransformerDesc[] = [hoisting]
