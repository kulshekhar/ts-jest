export interface MyType {
  foo: string
  bar: number
}

export function myLibraryFunction(): MyType {
  return {
    foo: 'Hello!',
    bar: 42
  }
}
