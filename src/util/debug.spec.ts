import { debug, wrapWithDebug, __setup, warn } from './debug'

const stdoutSpy = jest.spyOn(process.stdout, 'write')
const stderrSpy = jest.spyOn(process.stderr, 'write')

beforeEach(() => {
  delete process.env.TS_JEST_DEBUG
  stderrSpy.mockReset()
  stdoutSpy.mockReset()
  stdoutSpy.mockImplementation(() => undefined)
  stderrSpy.mockImplementation(() => undefined)
})
afterAll(() => {
  stderrSpy.mockRestore()
  stdoutSpy.mockRestore()
})

describe('debug', () => {
  it('should log to stdout when TS_JEST_DEBUG is truthy', () => {
    process.env.TS_JEST_DEBUG = '1'
    __setup()
    debug('foo')
    expect(stdoutSpy).toHaveBeenCalledTimes(1)
    expect(stdoutSpy.mock.calls[0][0]).toBe('ts-jest: foo\n')
  })
  it('should NOT log to stdout when TS_JEST_DEBUG is falsy', () => {
    process.env.TS_JEST_DEBUG = ''
    __setup()
    debug('foo')
    expect(stdoutSpy).not.toHaveBeenCalled()
  })
  it('should NOT log to stdout when TS_JEST_DEBUG is not set', () => {
    delete process.env.TS_JEST_DEBUG
    __setup()
    debug('foo')
    expect(stdoutSpy).not.toHaveBeenCalled()
  })
})
describe('warn', () => {
  it('should log to stderr when TS_JEST_DEBUG is truthy', () => {
    process.env.TS_JEST_DEBUG = '1'
    __setup()
    warn('foo')
    expect(stderrSpy).toHaveBeenCalledTimes(1)
    expect(stderrSpy.mock.calls[0][0]).toBe('ts-jest: foo\n')
  })
  it('should log to stderr even when TS_JEST_DEBUG is falsy', () => {
    delete process.env.TS_JEST_DEBUG
    __setup()
    warn('foo')
    expect(stderrSpy).toHaveBeenCalledTimes(1)
    expect(stderrSpy.mock.calls[0][0]).toBe('ts-jest: foo\n')
  })
})

describe('wrapWithDebug', () => {
  const subject = (val: string) => `hello ${val}`
  const wrapAndCall = (val: string) => wrapWithDebug('foo', subject)(val)

  it('should log to stdout when TS_JEST_DEBUG is truthy', () => {
    process.env.TS_JEST_DEBUG = '1'
    __setup()
    expect(wrapAndCall('bar')).toBe('hello bar')
    expect(stdoutSpy).toHaveBeenCalledTimes(1)
    expect(stdoutSpy.mock.calls[0][0]).toBe('ts-jest: foo\n')
  })
  it('should NOT log to stdout when TS_JEST_DEBUG is falsy', () => {
    process.env.TS_JEST_DEBUG = ''
    __setup()
    expect(wrapAndCall('bar')).toBe('hello bar')
    expect(stdoutSpy).not.toHaveBeenCalled()
  })
  it('should NOT log to stdout when TS_JEST_DEBUG is not set', () => {
    delete process.env.TS_JEST_DEBUG
    __setup()
    expect(wrapAndCall('bar')).toBe('hello bar')
    expect(stdoutSpy).not.toHaveBeenCalled()
  })
})
