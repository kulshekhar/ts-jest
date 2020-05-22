const cacheProp = Symbol.for('[memoize]') as any

/**
 * @internal
 */
export function Memoize(keyBuilder?: (...args: any[]) => any) {
  /* eslint-disable-next-line  @typescript-eslint/ban-types */
  return (_: object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): void => {
    if (descriptor.value != null) {
      descriptor.value = memoize(propertyKey, descriptor.value, keyBuilder || ((v: any) => v))
    } else if (descriptor.get != null) {
      descriptor.get = memoize(propertyKey, descriptor.get, keyBuilder || (() => propertyKey))
    }
  }
}

// See https://github.com/microsoft/TypeScript/issues/1863#issuecomment-579541944
/* eslint-disable-next-line  @typescript-eslint/ban-types */
function ensureCache<T extends Record<string, unknown> & { [key: string]: any }>(
  target: T,
  reset = false,
): { [key in keyof T]?: Map<any, any> } {
  if (reset || !target[cacheProp]) {
    Object.defineProperty(target, cacheProp, {
      value: Object.create(null),
      configurable: true,
    })
  }

  return target[cacheProp]
}

// See https://github.com/microsoft/TypeScript/issues/1863#issuecomment-579541944
/* eslint-disable-next-line  @typescript-eslint/ban-types */
function ensureChildCache<T extends Record<string, unknown> & { [key: string]: any }>(
  target: T,
  key: keyof T,
  reset = false,
): Map<any, any> {
  const dict = ensureCache(target)
  if (reset || !dict[key]) {
    dict[key] = new Map<any, any>()
  }

  return dict[key] as Map<any, any>
}

function memoize(
  namespace: string,
  func: (...args: any[]) => any,
  keyBuilder: (...args: any[]) => any,
): (...args: any[]) => any {
  return function (this: any, ...args: any[]): any {
    const cache = ensureChildCache(this, namespace)
    const key = keyBuilder.apply(this, args)
    if (cache.has(key)) return cache.get(key)
    const res: any = func.apply(this, args)
    cache.set(key, res)
    return res
  }
}
