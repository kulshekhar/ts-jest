import { camelCase } from 'lodash'

export function getBar(msg: string): string {
  return camelCase(msg) + 'foo'
}
