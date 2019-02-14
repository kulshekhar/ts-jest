interface MockWithArgs<T> extends Function, jest.MockInstance<T> {
  new (...args: ArgumentsOf<T>): T
  (...args: ArgumentsOf<T>): any
}

// tslint:disable-next-line:ban-types
type MethodKeysOf<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
// tslint:disable-next-line:ban-types
type PropertyKeysOf<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
type ArgumentsOf<T> = T extends (...args: infer A) => any ? A : never
interface MockWithArgs<T> extends Function, jest.MockInstance<T> {
  new (...args: ArgumentsOf<T>): T
  (...args: ArgumentsOf<T>): any
}

type MockedFunction<T> = MockWithArgs<T> & { [K in keyof T]: T[K] }
type MockedFunctionDeep<T> = MockWithArgs<T> & MockedObjectDeep<T>
type MockedObject<T> = { [K in MethodKeysOf<T>]: MockedFunction<T[K]> } & { [K in PropertyKeysOf<T>]: T[K] }
type MockedObjectDeep<T> = { [K in MethodKeysOf<T>]: MockedFunctionDeep<T[K]> } &
  { [K in PropertyKeysOf<T>]: MaybeMockedDeep<T[K]> }

// tslint:disable-next-line:ban-types
export type MaybeMockedDeep<T> = T extends Function ? MockedFunctionDeep<T> : T extends object ? MockedObjectDeep<T> : T
// tslint:disable-next-line:ban-types
export type MaybeMocked<T> = T extends Function ? MockedFunction<T> : T extends object ? MockedObject<T> : T

// the typings test helper
export function mocked<T>(item: T, deep?: false): MaybeMocked<T>
export function mocked<T>(item: T, deep: true): MaybeMockedDeep<T>
export function mocked<T>(item: T, _deep = false): MaybeMocked<T> | MaybeMockedDeep<T> {
  return item as any
}
