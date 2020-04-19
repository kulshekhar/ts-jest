import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'
import * as _ts from 'typescript'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import ProcessedSource from '../__helpers__/processed-source'
import { TS_JEST_OUT_DIR } from '../config/config-set'

import * as compilerUtils from './compiler-utils'

const logTarget = logTargetMock()

describe('Transpiler', () => {
  const baseTsJestConfig = {
    isolatedModules: true,
  }

  beforeEach(() => {
    logTarget.clear()
  })

  it('should compile using transpileModule and not use cache', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })
    const spy = jest.spyOn(_ts, 'transpileModule')

    logTarget.clear()
    const compiled = compiler.compile('export default 42', __filename)

    expect(new ProcessedSource(compiled, __filename)).toMatchSnapshot()
    expect(spy).toHaveBeenCalled()
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): no cache
      ",
        "[level:20] compileFn(): compiling as isolated module
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
      ]
    `)

    spy.mockRestore()
  })

  it(
    'should call createProgram() with projectReferences, call getAndCacheProjectReference()' +
      ' and getCompileResultFromReferenceProject() when there are projectReferences from tsconfig',
    () => {
      const programSpy = jest.spyOn(_ts, 'createProgram')
      const source = 'console.log("hello")'
      const fileName = 'isolated-test-reference-project.ts'
      const getAndCacheProjectReferenceSpy = jest
        .spyOn(compilerUtils, 'getAndCacheProjectReference')
        .mockReturnValueOnce({} as any)
      jest
        .spyOn(compilerUtils, 'getCompileResultFromReferencedProject')
        .mockImplementationOnce(() => [
          source,
          '{"version":3,"file":"isolated-test-reference-project.js","sourceRoot":"","sources":["isolated-test-reference-project.ts"],"names":[],"mappings":"AAAA,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,CAAA","sourcesContent":["console.log(\\"hello\\")"]}',
        ])
      writeFileSync(fileName, source)
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          tsConfig: 'src/__mocks__/tsconfig-project-references.json',
        },
      })
      compiler.compile(source, fileName)

      expect(programSpy).toHaveBeenCalled()
      expect((programSpy.mock.calls[0][0] as any).options.configFilePath).toContain('tsconfig-project-references.json')
      expect(getAndCacheProjectReferenceSpy).toHaveBeenCalled()
      expect(compilerUtils.getCompileResultFromReferencedProject).toHaveBeenCalled()

      jest.restoreAllMocks()
      removeSync(fileName)
    },
  )

  it('should call createProgram() without projectReferences when there are no projectReferences from tsconfig', () => {
    const programSpy = jest.spyOn(_ts, 'createProgram')
    const source = 'console.log("hello")'
    const fileName = 'isolated-test-reference-project-1.ts'
    const getAndCacheProjectReferenceSpy = jest
      .spyOn(compilerUtils, 'getAndCacheProjectReference')
      .mockReturnValueOnce(undefined)
    jest.spyOn(compilerUtils, 'getCompileResultFromReferencedProject')
    writeFileSync(fileName, source, 'utf8')
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: false,
      },
    })
    compiler.compile(source, fileName)

    expect(programSpy).toHaveBeenCalled()
    expect((programSpy.mock.calls[0][1] as any).configFilePath).toBeUndefined()
    expect(getAndCacheProjectReferenceSpy).toHaveBeenCalled()
    expect(compilerUtils.getCompileResultFromReferencedProject).not.toHaveBeenCalled()

    jest.restoreAllMocks()
    removeSync(fileName)
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
