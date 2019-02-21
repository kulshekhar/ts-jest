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

export class MyClass {
  constructor(s: string) {
    this.myProperty = 3
    this.myStr = s
  }
  somethingClassy() { return this.myStr }
  public myProperty: number;
  public myStr: string;
}
