import { AstTransformerDesc } from '../types'

import * as hoisting from './hoist-jest'

export const internals: AstTransformerDesc[] = [hoisting]
