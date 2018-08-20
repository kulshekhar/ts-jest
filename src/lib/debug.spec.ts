import { spyThese } from '../__helpers__/mocks'
import { debug, wrapWithDebug, __setup } from './debug'

const consoleSpies = spyThese(console, {
  log: () => void 0,
  warn: () => void 0,
})

beforeEach(() => {
  delete process.env.TS_JEST_DEBUG
  consoleSpies.mockClear()
})

describe('debug', () => {
  it('should log when TS_JEST_DEBUG is truthy', () => {
    process.env.TS_JEST_DEBUG = '1'
    __setup()
    debug('foo')
    expect(consoleSpies.log).toHaveBeenCalledTimes(1)
    expect(consoleSpies.log).toHaveBeenCalledWith('ts-jest:', 'foo')
  })
  it('should NOT log when TS_JEST_DEBUG is falsy', () => {
    process.env.TS_JEST_DEBUG = ''
    __setup()
    debug('foo')
    expect(consoleSpies.log).not.toHaveBeenCalled()
  })
  it('should NOT log when TS_JEST_DEBUG is not set', () => {
    delete process.env.TS_JEST_DEBUG
    __setup()
    debug('foo')
    expect(consoleSpies.log).not.toHaveBeenCalled()
  })
})

describe('wrapWithDebug', () => {
  const subject = (val: string) => `hello ${val}`
  const wrapAndCall = (val: string) => wrapWithDebug('foo', subject)(val)

  it('should log when TS_JEST_DEBUG is truthy', () => {
    process.env.TS_JEST_DEBUG = '1'
    __setup()
    expect(wrapAndCall('bar')).toBe('hello bar')
    expect(consoleSpies.log).toHaveBeenCalledTimes(1)
    expect(consoleSpies.log).toHaveBeenCalledWith('ts-jest:', 'foo')
  })
  it('should NOT log when TS_JEST_DEBUG is falsy', () => {
    process.env.TS_JEST_DEBUG = ''
    __setup()
    expect(wrapAndCall('bar')).toBe('hello bar')
    expect(consoleSpies.log).not.toHaveBeenCalled()
  })
  it('should NOT log when TS_JEST_DEBUG is not set', () => {
    delete process.env.TS_JEST_DEBUG
    __setup()
    expect(wrapAndCall('bar')).toBe('hello bar')
    expect(consoleSpies.log).not.toHaveBeenCalled()
  })
})
