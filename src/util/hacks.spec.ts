import * as hacks from './hacks'

describe('patchBabelCore_githubIssue6577', () => {
  class FileMock {
    // tslint:disable-next-line:prefer-function-over-method no-empty
    initOptions(_: any): any {}
  }
  const RESET = { reset: 'reset' }
  const originalInitOptions = (options: any) => {
    const opt = { ...options }
    // this is the buggy part overwriting the sourceMaps option that the patch should fix
    if (opt.inputSourceMap) {
      opt.sourceMaps = RESET
    }
    return opt
  }
  beforeAll(() => {
    jest.doMock('babel-core/lib/transformation/file', () => ({ File: FileMock }))
    jest.resetModules()
  })
  afterAll(() => {
    jest.unmock('babel-core/lib/transformation/file')
  })

  const INPUT = { input: 'input' }
  const resetAndPatch = (version?: any) => {
    FileMock.prototype.initOptions = originalInitOptions
    hacks.patchBabelCore_githubIssue6577({ version } as any)
  }
  const getClass = () => require('babel-core/lib/transformation/file').File
  const initOptions = (sourceMaps?: any) => {
    // reset it to the original version
    const File = getClass()
    return new File().initOptions({ sourceMaps, inputSourceMap: true })
  }

  it('should not wrap the method if version of babel is not 6', () => {
    resetAndPatch(null)
    expect(getClass().prototype.initOptions).toBe(originalInitOptions)
    resetAndPatch('7.1.0')
    expect(getClass().prototype.initOptions).toBe(originalInitOptions)
  })

  it('should not restore sourceMaps input value if falsy', () => {
    resetAndPatch('6.2.0')
    expect(initOptions(false).sourceMaps).toBe(RESET)
    expect(initOptions(undefined).sourceMaps).toBe(RESET)
    expect(initOptions(null).sourceMaps).toBe(RESET)
    expect(initOptions(0).sourceMaps).toBe(RESET)
  })
  it('should restore sourceMaps input value if truthy', () => {
    resetAndPatch('6.9.4-alpha.0')
    expect(initOptions(INPUT).sourceMaps).toBe(INPUT)
    resetAndPatch('6.1.5')
    expect(initOptions(INPUT).sourceMaps).toBe(INPUT)
    expect(initOptions('foo').sourceMaps).toBe('foo')
  })
})
