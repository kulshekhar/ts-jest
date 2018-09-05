import { AstTransformerDesc } from '../types'

import * as hoisting from './hoisting'

export const internals: AstTransformerDesc[] = [hoisting]
