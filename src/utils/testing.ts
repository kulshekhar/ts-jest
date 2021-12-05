// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockableFunction = (...args: any[]) => any
export type MethodKeysOf<T> = { [K in keyof T]: T[K] extends MockableFunction ? K : never }[keyof T]
export type PropertyKeysOf<T> = { [K in keyof T]: T[K] extends MockableFunction ? never : K }[keyof T]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArgumentsOf<T> = T extends (...args: infer A) => any ? A : never
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstructorArgumentsOf<T> = T extends new (...args: infer A) => any ? A : never

export interface MockWithArgs<T extends MockableFunction> extends jest.MockInstance<ReturnType<T>, ArgumentsOf<T>> {
  new (...args: ConstructorArgumentsOf<T>): T
  (...args: ArgumentsOf<T>): ReturnType<T>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MaybeMockedConstructor<T> = T extends new (...args: any[]) => infer R
  ? jest.MockInstance<R, ConstructorArgumentsOf<T>>
  : T
export type MockedFunction<T extends MockableFunction> = MockWithArgs<T> & { [K in keyof T]: T[K] }
export type MockedFunctionDeep<T extends MockableFunction> = MockWithArgs<T> & MockedObjectDeep<T>
export type MockedObject<T> = MaybeMockedConstructor<T> & {
  [K in MethodKeysOf<T>]: T[K] extends MockableFunction ? MockedFunction<T[K]> : T[K]
} & { [K in PropertyKeysOf<T>]: T[K] }
export type MockedObjectDeep<T> = MaybeMockedConstructor<T> & {
  [K in MethodKeysOf<T>]: T[K] extends MockableFunction ? MockedFunctionDeep<T[K]> : T[K]
} & { [K in PropertyKeysOf<T>]: MaybeMockedDeep<T[K]> }

export type MaybeMockedDeep<T> = T extends MockableFunction
  ? MockedFunctionDeep<T>
  : T extends object // eslint-disable-line @typescript-eslint/ban-types
  ? MockedObjectDeep<T>
  : T
// eslint-disable-next-line @typescript-eslint/ban-types
export type MaybeMocked<T> = T extends MockableFunction ? MockedFunction<T> : T extends object ? MockedObject<T> : T

// the typings test helper
export function mocked<T>(item: T, deep?: false): MaybeMocked<T>
// eslint-disable-next-line no-redeclare
export function mocked<T>(item: T, deep: true): MaybeMockedDeep<T>
// eslint-disable-next-line no-redeclare
export function mocked<T>(item: T, _deep = false): MaybeMocked<T> | MaybeMockedDeep<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return item as any
}
