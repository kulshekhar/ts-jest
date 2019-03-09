// tslint:disable-next-line:ban-types
type MethodKeysOf<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
// tslint:disable-next-line:ban-types
type PropertyKeysOf<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
type ArgumentsOf<T> = T extends (...args: infer A) => any ? A : never
interface MockWithArgs<T, Y extends any[]> extends Function, jest.MockInstance<T, Y> {
  new (...args: ArgumentsOf<T>): T
  (...args: ArgumentsOf<T>): any
}

type MockedFunction<T, Y extends any[]> = MockWithArgs<T, Y> & { [K in keyof T]: T[K] }
type MockedFunctionDeep<T, Y extends any[]> = MockWithArgs<T, Y> & MockedObjectDeep<T, Y>
type MockedObject<T, Y extends any[]> = { [K in MethodKeysOf<T>]: MockedFunction<T[K], Y> } &
  { [K in PropertyKeysOf<T>]: T[K] }
type MockedObjectDeep<T, Y extends any[]> = { [K in MethodKeysOf<T>]: MockedFunctionDeep<T[K], Y> } &
  { [K in PropertyKeysOf<T>]: MaybeMockedDeep<T[K], Y> }

// tslint:disable-next-line:ban-types
export type MaybeMockedDeep<T, Y extends any[]> = T extends Function
  ? MockedFunctionDeep<T, Y>
  : T extends object
  ? MockedObjectDeep<T, Y>
  : T
// tslint:disable-next-line:ban-types
export type MaybeMocked<T, Y extends any[]> = T extends Function
  ? MockedFunction<T, Y>
  : T extends object
  ? MockedObject<T, Y>
  : T

// the typings test helper
export function mocked<T, Y extends any[]>(item: T, deep?: false): MaybeMocked<T, Y>
export function mocked<T, Y extends any[]>(item: T, deep: true): MaybeMockedDeep<T, Y>
export function mocked<T, Y extends any[]>(item: T, _deep = false): MaybeMocked<T, Y> | MaybeMockedDeep<T, Y> {
  return item as any
}
