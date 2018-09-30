import { MaybeMocked, MaybeMockedDeep } from '../types'

// the typings test helper
export function mocked<T>(item: T, deep?: false): MaybeMocked<T>
export function mocked<T>(item: T, deep: true): MaybeMockedDeep<T>
export function mocked<T>(item: T, _deep = false): MaybeMocked<T> | MaybeMockedDeep<T> {
  return item as any
}
