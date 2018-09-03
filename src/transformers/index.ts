import { CustomTransformers } from 'typescript'

import { ConfigSet } from '../config/config-set'

import { factory as hoistingFactory } from './hoisting'

export function factory(cs: ConfigSet): CustomTransformers {
  return {
    before: [hoistingFactory(cs)],
  }
}
