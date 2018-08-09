const gettersProp = Symbol.for('[memoize:getters]');
const methodsProp = Symbol.for('[memoize:methods]');

export default function Memoize(keyBuilder?: (...args: any[]) => any) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor.value != null) {
      descriptor.value = memoize(
        methodsProp,
        descriptor.value,
        keyBuilder || ((v: any) => v),
      );
    } else if (descriptor.get != null) {
      descriptor.get = memoize(
        gettersProp,
        descriptor.get,
        keyBuilder || (() => propertyKey),
      );
    }
  };
}

function memoize(
  prop: symbol,
  func: (...args: any[]) => any,
  keyBuilder: (...args: any[]) => any,
): (...args: any[]) => any {
  return function(this: any, ...args: any[]): any {
    const cache =
      this[prop] ||
      Object.defineProperty(this, prop, { value: new Map<any, any>() })[prop];
    const key = keyBuilder.apply(this, args);
    if (cache.has(key)) return cache.get(key) as any; // tslint:disable-line
    const res: any = func.apply(this, args);
    cache.set(key, res);
    return res;
  };
}
