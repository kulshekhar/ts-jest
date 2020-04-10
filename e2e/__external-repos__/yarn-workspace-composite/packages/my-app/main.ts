import { myLibraryFunction } from '../my-library'

export function main() {
  const value = myLibraryFunction()

  // tslint:disable-next-line:no-console
  console.log(`You got foo: "${value.foo}" and bar: ${value.bar}`)
}

if (require.main === module) {
  main()
}
