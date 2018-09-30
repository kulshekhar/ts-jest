export const foo = () => 'foo'

export function bar() {
  return 'bar'
}
export namespace bar {
  export function dummy() {
    return 'dummy'
  }
  export namespace dummy {
    export const deep = {
      deeper: (one: string = '1') => `deeper ${one}`
    }
  }
}
