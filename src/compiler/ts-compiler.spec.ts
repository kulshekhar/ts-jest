import { readFileSync } from 'fs'
import { LogLevels } from 'bs-logger'

import { TS_JEST_OUT_DIR } from '../config/config-set'
import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

describe('TsCompiler', () => {
  describe('isolatedModule true', () => {
    const baseTsJestConfig = {
      isolatedModules: true,
    }

    it('should compile js file for allowJs true', () => {
      const fileName = 'foo.js'
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, tsconfig: { allowJs: true, outDir: TS_JEST_OUT_DIR } },
      })
      const source = 'export default 42'

      const compiled = compiler.getCompiledOutput(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
    })

    describe('jsx option', () => {
      const fileName = 'foo.tsx'
      const source = `
        const App = () => {
          return <>Test</>
        }
      `

      it('should compile tsx file for jsx preserve', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              jsx: 'preserve' as any,
            },
          },
        })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
      })

      it('should compile tsx file for other jsx options', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              jsx: 'react' as any,
            },
          },
        })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
      })
    })

    describe('source maps', () => {
      const source = 'const f = (v: number) => v\nconst t: number = f(5)'
      const fileName = 'test-source-map-transpiler.ts'

      it('should have correct source maps without mapRoot', () => {
        const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })

      it('should have correct source maps with mapRoot', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              mapRoot: './',
            },
          },
        })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })
    })

    describe('diagnostics', () => {
      it('should not report diagnostics related to typings', () => {
        const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })

        expect(() =>
          compiler.getCompiledOutput(
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
        const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })

        expect(() =>
          compiler.getCompiledOutput(
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
          tsJestConfig: { ...baseTsJestConfig, tsconfig: false, diagnostics: { pathRegex: 'foo.ts' } },
        })

        expect(() =>
          compiler.getCompiledOutput(
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
          tsJestConfig: { ...baseTsJestConfig, tsconfig: false, diagnostics: { pathRegex: 'bar.ts' } },
        })

        expect(() =>
          compiler.getCompiledOutput(
            `
const f = (v: number) = v
const t: string = f(5)
`,
            'foo.ts',
          ),
        ).not.toThrowError()
      })
    })
  })

  describe('isolatedModule false', () => {
    const baseTsJestConfig = { tsconfig: require.resolve('../../tsconfig.spec.json') }

    beforeEach(() => {
      logTarget.clear()
    })

    describe('allowJs option', () => {
      const fileName = 'test-allow-js.js'
      const source = 'export default 42'

      it('should compile js file for allowJs true with outDir', () => {
        const compiler = makeCompiler({
          tsJestConfig: { tsconfig: { allowJs: true, outDir: '$$foo$$' } },
        })

        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
      })

      it('should compile js file for allowJs true without outDir', () => {
        const compiler = makeCompiler({
          tsJestConfig: { tsconfig: { allowJs: true } },
        })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
      })
    })

    describe('jsx option', () => {
      const fileName = 'test-jsx.tsx'
      const source = `
        const App = () => {
          return <>Test</>
        }
      `

      it('should compile tsx file for jsx preserve', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: {
              jsx: 'preserve' as any,
            },
          },
        })

        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
      })

      it('should compile tsx file for other jsx options', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: {
              jsx: 'react' as any,
            },
          },
        })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
      })
    })

    describe('source maps', () => {
      const source = 'const gsm = (v: number) => v\nconst h: number = gsm(5)'
      const fileName = 'test-source-map.ts'

      it('should have correct source maps without mapRoot', () => {
        const compiler = makeCompiler({ tsJestConfig: { tsconfig: require.resolve('../../tsconfig.spec.json') } })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })

      it('should have correct source maps with mapRoot', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: {
              mapRoot: './',
            },
          },
        })
        const compiled = compiler.getCompiledOutput(source, fileName)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })
    })

    describe('module resolution', () => {
      it(`should use moduleResolutionCache`, () => {
        jest.unmock('typescript')
        const ts = require('typescript')
        const moduleResolutionCacheMock = (ts.createModuleResolutionCache = jest.fn().mockImplementation(() => {}))

        makeCompiler({
          tsJestConfig: baseTsJestConfig,
        })

        expect(moduleResolutionCacheMock).toHaveBeenCalled()
        expect(moduleResolutionCacheMock.mock.calls[0].length).toBe(3)

        moduleResolutionCacheMock.mockRestore()
      })
    })

    describe('diagnostics', () => {
      const importedFileName = require.resolve('../__mocks__/thing.ts')
      const importedFileContent = readFileSync(importedFileName, 'utf-8')

      it(`shouldn't report diagnostics when file name doesn't match diagnostic file pattern`, () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            diagnostics: { pathRegex: 'foo.spec.ts' },
          },
        })

        expect(() => compiler.getCompiledOutput(importedFileContent, importedFileName)).not.toThrowError()
      })

      it(`shouldn't report diagnostic when processing file isn't used by any test files`, () => {
        const compiler = makeCompiler({
          tsJestConfig: baseTsJestConfig,
        })
        logTarget.clear()

        compiler.getCompiledOutput(importedFileContent, 'foo.ts')

        expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchSnapshot()
      })

      it('should throw error when cannot compile', () => {
        const fileName = 'test-cannot-compile.d.ts'
        const source = `
        interface Foo {
          a: string
        }
      `
        const compiler = makeCompiler({
          tsJestConfig: baseTsJestConfig,
        })

        expect(() => compiler.getCompiledOutput(source, fileName)).toThrowErrorMatchingSnapshot()
      })
    })
  })
})
