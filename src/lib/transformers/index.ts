import { ConfigSet } from '../config-set'
import { CustomTransformers } from 'typescript'
import { factory as hoistingFactory } from './hoisting'

export function factory(cs: ConfigSet): CustomTransformers {
  return {
    before: [hoistingFactory(cs)],
  }
}
