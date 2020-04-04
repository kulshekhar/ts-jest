import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import ProcessedSource from '../__helpers__/processed-source'
import { TS_JEST_OUT_DIR } from '../config/config-set'

const logTarget = logTargetMock()

describe('transpile module with isolatedModule: true', () => {
  const baseTsJestConfig = {
    isolatedModules: true,
  }

  beforeEach(() => {
    logTarget.clear()
  })

  it('should compile using transpileModule and not use cache', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })
    const spy = jest.spyOn(require('typescript'), 'transpileModule')

    logTarget.clear()
    const compiled = compiler.compile('export default 42', __filename)

    expect(new ProcessedSource(compiled, __filename)).toMatchSnapshot()
    expect(spy).toHaveBeenCalled()
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): no cache
      ",
        "[level:20] getOutput(): compiling as isolated module
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
      ]
    `)

    spy.mockRestore()
  })

  it('should compile js file for allowJs true', () => {
    const fileName = `${__filename}.test.js`
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: { allowJs: true, outDir: TS_JEST_OUT_DIR } },
    })
    const source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for jsx preserve', () => {
    const fileName = `foo.tsx`
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: {
          jsx: 'preserve' as any,
        },
      },
    })
    const source = `
        const App = () => {
          return <>Test</>
        }
      `

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for other jsx options', () => {
    const fileName = `foo.tsx`
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: {
          jsx: 'react' as any,
        },
      },
    })
    const source = `
        const App = () => {
          return <>Test</>
        }
      `

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should have correct source maps', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })
    const source = 'const f = (v: number) => v\nconst t: number = f(5)'

    const compiled = compiler.compile(source, __filename)

    expect(new ProcessedSource(compiled, __filename).outputSourceMaps).toMatchObject({
      file: __filename,
      sources: [__filename],
      sourcesContent: [source],
    })
  })

  it('should not report diagnostics related to typings', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
        'foo.ts',
      ),
    ).not.toThrowError()
  })

  it('should report diagnostics related to codes with pathRegex config is undefined', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) = v
const t: string = f(5)
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should report diagnostics related to codes with pathRegex config matches file name', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: 'foo.ts' } },
    })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) = v
const t: string = f(5)
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should not report diagnostics related to codes with pathRegex config does not match file name', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: 'bar.ts' } },
    })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) = v
const t: string = f(5)
`,
        'foo.ts',
      ),
    ).not.toThrowError()
  })
})
