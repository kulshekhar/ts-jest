export function getBar(msg: string): string {
  return camelCase(msg) + 'foo'
}

export function camelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
}
