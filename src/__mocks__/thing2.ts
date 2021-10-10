import camelCase from 'lodash/camelCase'

export function getBar(msg: string): string {
  return camelCase(msg) + 'foo'
}
