import camelCase from 'lodash.camelcase'

import { getBar } from './thing2'

export function getFoo(msg: string): string {
  return camelCase(msg) + getBar(msg)
}

export function getFooBar(msg: string): string {
  return getBar(msg) + 'foo'
}
