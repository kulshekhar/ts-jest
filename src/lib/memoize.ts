const cacheProp = Symbol.for('[memoize]')

export function Memoize(keyBuilder?: (...args: any[]) => any) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    if (descriptor.value != null) {
      descriptor.value = memoize(
        propertyKey,
        descriptor.value,
        keyBuilder || ((v: any) => v)
      )
    } else if (descriptor.get != null) {
      descriptor.get = memoize(
        propertyKey,
        descriptor.get,
        keyBuilder || (() => propertyKey)
      )
    }
  }
}

function memoize(
  namespace: string,
  func: (...args: any[]) => any,
  keyBuilder: (...args: any[]) => any
): (...args: any[]) => any {
  return function(this: any, ...args: any[]): any {
    const dict: { [key: string]: Map<any, any> } =
      this[cacheProp] ||
      Object.defineProperty(this, cacheProp, { value: Object.create(null) })[
        cacheProp
      ]
    const cache: Map<any, any> =
      dict[namespace] || (dict[namespace] = new Map<any, any>())
    const key = keyBuilder.apply(this, args)
    if (cache.has(key)) return cache.get(key) as any // tslint:disable-line
    const res: any = func.apply(this, args)
    cache.set(key, res)
    return res
  }
}
