import * as hacks from './hacks'
import { File } from 'babel-core/lib/transformation/file'

jest.mock(
  'babel-core/lib/transformation/file',
  () => ({
    File: class {
      initOptions(options: any) {
        const opt = { ...options }
        // this is the buggy part overwriting the sourceMaps option that the patch should fix
        if (opt.inputSourceMap) {
          opt.sourceMaps = true
        }
        return opt
      }
    },
  }),
  { virtual: true },
)

describe('patchBabelCore_githubIssue6577', () => {
  const INPUT = 'foo:bar'
  const initOptions = ({
    version = '6.0.0',
    sourceMaps,
  }: { version?: any; sourceMaps?: any } = {}) => {
    hacks.patchBabelCore_githubIssue6577({ version } as any)
    return new File().initOptions({ sourceMaps, inputSourceMap: true })
  }

  it('should not reset it if version of babel is not 6', () => {
    expect(
      initOptions({ version: null, sourceMaps: INPUT }).sourceMaps,
    ).not.toBe(INPUT)
    expect(
      initOptions({ version: '7.1.0', sourceMaps: INPUT }).sourceMaps,
    ).not.toBe(INPUT)
  })

  it('should not reset it if option is falsy', () => {
    expect(initOptions({ sourceMaps: false }).sourceMaps).not.toBe(false)
    expect(initOptions({ sourceMaps: undefined }).sourceMaps).not.toBe(
      undefined,
    )
    expect(initOptions({ sourceMaps: null }).sourceMaps).not.toBe(null)
  })
  it('should reset to input value if truthy', () => {
    expect(
      initOptions({ version: '6.9.4-dummy0', sourceMaps: INPUT }).sourceMaps,
    ).toBe(INPUT)
    expect(initOptions({ sourceMaps: INPUT }).sourceMaps).toBe(INPUT)
    expect(initOptions({ sourceMaps: 'dummy' }).sourceMaps).toBe('dummy')
  })
})
