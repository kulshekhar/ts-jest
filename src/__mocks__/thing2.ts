import camelCase from 'lodash.camelcase'

export function getBar(msg: string): string {
  return camelCase(msg) + 'foo'
}
