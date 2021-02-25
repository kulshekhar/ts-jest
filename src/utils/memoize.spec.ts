import { Memoize } from './memoize'

describe('memoize', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharedHasher = jest.fn((...args: any[]) => args.join(':'))
  class Dummy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _getter = jest.fn(function getter(this: any) {
      return this.data.getter
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _method0 = jest.fn(function method0(this: any) {
      return this.data.method0
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _method1 = jest.fn(function method1(this: any, ...args: any[]) {
      return [this.data.method1, ...args].join(':')
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _method2 = jest.fn(function method2(this: any, ...args: any[]) {
      return [this.data.method2, ...args].join(':')
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(public data: any) {}

    @Memoize()
    get getter() {
      return this._getter()
    }

    @Memoize()
    method0() {
      return this._method0()
    }

    @Memoize()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    method1(...args: any[]) {
      return this._method1(...args)
    }

    @Memoize(sharedHasher)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    method2(...args: any[]) {
      return this._method2(...args)
    }
  }
  let subjectA!: Dummy
  let subjectB!: Dummy

  beforeEach(() => {
    jest.clearAllMocks()
    subjectA = new Dummy({
      getter: 'getter A',
      method0: 'method0 A',
      method1: 'method1 A',
      method2: 'method2 A',
    })
    subjectB = new Dummy({
      getter: 'getter B',
      method0: 'method0 B',
      method1: 'method1 B',
      method2: 'method2 B',
    })
  })

  it('should remember getter values', () => {
    expect(subjectA.getter).toBe('getter A')
    expect(subjectA._getter).toHaveBeenCalledTimes(1)
    expect(subjectB._getter).toHaveBeenCalledTimes(0)
    expect(subjectB.getter).toBe('getter B')
    expect(subjectA._getter).toHaveBeenCalledTimes(1)
    expect(subjectB._getter).toHaveBeenCalledTimes(1)
    expect(subjectA.getter).toBe('getter A')
    expect(subjectB.getter).toBe('getter B')
    expect(subjectA._getter).toHaveBeenCalledTimes(1)
    expect(subjectB._getter).toHaveBeenCalledTimes(1)
  })

  it('should remember method values with no args', () => {
    expect(subjectA.method0()).toBe('method0 A')
    expect(subjectA._method0).toHaveBeenCalledTimes(1)
    expect(subjectB._method0).toHaveBeenCalledTimes(0)
    expect(subjectB.method0()).toBe('method0 B')
    expect(subjectA._method0).toHaveBeenCalledTimes(1)
    expect(subjectB._method0).toHaveBeenCalledTimes(1)
    expect(subjectA.method0()).toBe('method0 A')
    expect(subjectB.method0()).toBe('method0 B')
    expect(subjectA._method0).toHaveBeenCalledTimes(1)
    expect(subjectB._method0).toHaveBeenCalledTimes(1)
  })

  it('should remember method values with one args', () => {
    expect(subjectA.method1('foo')).toBe('method1 A:foo')
    expect(subjectA._method1).toHaveBeenCalledTimes(1)
    expect(subjectA.method1('bar')).toBe('method1 A:bar')
    expect(subjectA._method1).toHaveBeenCalledTimes(2)
    expect(subjectA.method1('foo')).toBe('method1 A:foo')
    expect(subjectA.method1('bar')).toBe('method1 A:bar')
    expect(subjectA._method1).toHaveBeenCalledTimes(2)
  })
})
