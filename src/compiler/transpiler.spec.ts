import { makeCompiler } from '../__helpers__/fakers'
import ProcessedSource from '../__helpers__/processed-source'
import { TS_JEST_OUT_DIR } from '../config/config-set'

describe('Transpiler', () => {
  const baseTsJestConfig = {
    isolatedModules: true,
  }

  it('should compile js file for allowJs true', () => {
    const fileName = 'foo.js'
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsconfig: { allowJs: true, outDir: TS_JEST_OUT_DIR } },
    })
    const source = 'export default 42'

    const compiled = compiler.compile(source, fileName)

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
      const compiled = compiler.compile(source, fileName)

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
      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
    })
  })

  describe('source maps', () => {
    const source = 'const f = (v: number) => v\nconst t: number = f(5)'
    const fileName = 'test-source-map-transpiler.ts'

    it('should have correct source maps without mapRoot', () => {
      const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })
      const compiled = compiler.compile(source, fileName)

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
      const compiled = compiler.compile(source, fileName)

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
      const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })

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

    it('should report diagnostics related to codes with exclude config matches file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, tsconfig: false, diagnostics: { exclude: ['foo.ts'] } },
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

    it('should not report diagnostics related to codes with exclude config does not match file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, tsconfig: false, diagnostics: { exclude: ['bar.ts'] } },
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
})
