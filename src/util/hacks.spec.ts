import { logTargetMock } from '../__helpers__/mocks'

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

  const EXAMPLE_VERSION_TO_PATCH = '6.2.0'
  const INPUT = { input: 'input' }
  const fileProtoFactory = () => ({ initOptions: originalInitOptions })
  const resetAndPatch = (version?: any, protoFactory: () => any = fileProtoFactory) => {
    Object.assign(FileMock.prototype, protoFactory())
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
    resetAndPatch(EXAMPLE_VERSION_TO_PATCH)
    expect(initOptions(false).sourceMaps).toBe(RESET)
    expect(initOptions(undefined).sourceMaps).toBe(RESET)
    expect(initOptions(null).sourceMaps).toBe(RESET)
    expect(initOptions(0).sourceMaps).toBe(RESET)
  })
  it('should restore sourceMaps input value if truthy', () => {
    resetAndPatch('6.9.4-alpha.0')
    expect(initOptions(INPUT).sourceMaps).toBe(INPUT)
    resetAndPatch(EXAMPLE_VERSION_TO_PATCH)
    expect(initOptions(INPUT).sourceMaps).toBe(INPUT)
    expect(initOptions('foo').sourceMaps).toBe('foo')
  })

  it('should not patch twice', () => {
    resetAndPatch(EXAMPLE_VERSION_TO_PATCH)
    let backup = getClass().prototype.initOptions
    resetAndPatch(EXAMPLE_VERSION_TO_PATCH)
    expect(getClass().prototype.initOptions).not.toBe(backup)

    backup = getClass().prototype.initOptions
    resetAndPatch(EXAMPLE_VERSION_TO_PATCH, () => ({}))
    expect(getClass().prototype.initOptions).toBe(backup)
  })

  it('should warn if an error occurs while patching', () => {
    const log = logTargetMock()
    log.clear()
    resetAndPatch(EXAMPLE_VERSION_TO_PATCH, () => ({ initOptions: null }))
    expect(log.lines.warn.join('\n')).toMatchInlineSnapshot(`
"[level:40] Error while trying to patch babel-core/lib/transformation/file: Cannot read property 'Symbol(ts-jest:patchBabelCore_githubIssue6577)' of null
"
`)
  })
})
