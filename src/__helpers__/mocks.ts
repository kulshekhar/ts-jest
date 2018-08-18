// typings helper
export function mocked<T>(
  val: T,
): T extends (...args: any[]) => any ? jest.MockInstance<T> : jest.Mocked<T> {
  return val as any
}
export function spied<T>(
  val: T,
): T extends (...args: any[]) => any ? jest.SpyInstance<T> : jest.Mocked<T> {
  return val as any
}

export function mockThese(
  map:
    | string[]
    | {
        [k: string]: () => any
      },
) {
  const isArray = Array.isArray(map)
  const items: string[] = isArray ? (map as string[]) : Object.keys(map)
  items.forEach(item => {
    const val = isArray ? () => item : (map as any)[item]
    jest.doMock(item, val, { virtual: true })
  })
}

export function spyThese<T extends object, K extends keyof T>(
  object: T,
  implementations: { [key in K]: T[K] | any | undefined },
): { [key in K]: jest.SpyInstance<T[K]> } & {
  mockRestore: () => void
  mockReset: () => void
  mockClear: () => void
} {
  const keys = Object.keys(implementations) as K[]
  const res = keys.reduce(
    (map, key) => {
      const actual = object[key] as any
      const spy = (map[key] = jest.spyOn(object, key as K))
      if (implementations[key]) {
        const impl = implementations[key] as (...args: any[]) => any
        if (impl.length && /\W\$super\W/.test(impl.toString())) {
          spy.mockImplementation(function(this: T, ...args: any[]) {
            return impl.call(this, () => actual.apply(this, args), ...args)
          })
        } else {
          spy.mockImplementation(impl)
        }
      }
      return map
    },
    {} as any,
  )
  // utility to restore/reset/clear all
  res.mockRestore = () => {
    keys.forEach(key => res[key].mockRestore())
  }
  res.mockReset = () => {
    keys.forEach(key => res[key].mockReset())
  }
  res.mockClear = () => {
    keys.forEach(key => res[key].mockClear())
  }
  return res
}
