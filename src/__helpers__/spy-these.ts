export default function spyThese<T extends object, K extends keyof T>(
  object: T,
  implementations: { [key in K]: T[K] | any | undefined },
): { [key in K]: jest.SpyInstance<T[K]> } & { mockRestore: () => void } {
  const keys = Object.keys(implementations) as K[];
  const res = keys.reduce(
    (map, key) => {
      const actual = object[key] as any;
      const spy = jest.spyOn(object, key as K);
      if (implementations[key]) {
        const impl = implementations[key] as (...args: any[]) => any;
        if (impl.length && /\W\$super\W/.test(impl.toString())) {
          spy.mockImplementation(function(this: T, ...args: any[]) {
            return impl.call(this, () => actual.apply(this, args), ...args);
          });
        } else {
          spy.mockImplementation(impl);
        }
      }
      return map;
    },
    {} as any,
  );
  // utility to restore all
  res.mockRestore = () => {
    keys.forEach(key => res[key].mockRestore());
  };
  return res;
}
