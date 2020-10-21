/* eslint-disable jest/no-mocks-import */
import type { Transformer } from '@jest/transform'
import { testing } from 'bs-logger'
import { join, resolve } from 'path'
import ts from 'typescript'

import { logTargetMock } from '../__helpers__/mocks'
import { createConfigSet } from '../__helpers__/fakers'
import type { TsJestGlobalOptions } from '../types'
import * as _backports from '../utils/backports'
import { getPackageVersion } from '../utils/get-package-version'
import { normalizeSlashes } from '../utils/normalize-slashes'
import { mocked } from '../utils/testing'

import { ConfigSet, MY_DIGEST, TS_JEST_OUT_DIR } from './config-set'

jest.mock('../utils/backports')
jest.mock('../index')
jest.mock('../utils/get-package-version')

const backports = mocked(_backports)

backports.backportJestConfig.mockImplementation((_, config) => ({
  ...config,
  __backported: true,
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('packageJson', () => {
  it('should not contain packageJson in final tsJest config', () => {
    expect(
      Object.keys(
        createConfigSet({
          jestConfig: {
            globals: {
              'ts-jest': {
                packageJson: true,
              },
            },
          } as any,
          resolve: null,
        }),
      ),
    ).not.toContain('packageJson')
  })
}) // packageJson

describe('parsedTsConfig', () => {
  const get = (tsJest?: TsJestGlobalOptions) => createConfigSet({ tsJestConfig: tsJest }).parsedTsConfig

  it('should read file list from default tsconfig', () => {
    // since the default is to lookup for tsconfig,
    // we should have this file in the list
    expect(get().fileNames).toContain(normalizeSlashes(__filename))
  })

  it.each(['tsConfig', 'tsconfig'])('should include compiler config from `%s` option key', (key: string) => {
    expect(get({ [key]: { baseUrl: 'src/config' } }).options.baseUrl).toBe(normalizeSlashes(__dirname))
  })

  it('should include compiler config from base config', () => {
    expect(get({ tsconfig: { target: 'esnext' } as any }).options.target).toBe(ts.ScriptTarget.ESNext)
  })

  it('should override some options', () => {
    expect(get({ tsconfig: { module: 'esnext' as any, inlineSources: false } }).options).toMatchObject({
      module: ts.ModuleKind.CommonJS,
      inlineSources: true,
    })
  })

  it('should include default outDir $$ts-jest$$ when allowJs is enabled and no outDir from config', () => {
    expect(get({ tsconfig: { allowJs: true } }).options.outDir).toBe(TS_JEST_OUT_DIR)
  })

  it('should be able to read extends', () => {
    const cs = createConfigSet({
      tsJestConfig: { tsconfig: 'tsconfig.build.json' },
      resolve: null,
    })
    expect(cs.parsedTsConfig.options).toMatchObject({
      module: ts.ModuleKind.CommonJS,
      rootDir: normalizeSlashes(resolve(__dirname, '..')),
      skipLibCheck: true,
    })
  })

  it('should warn about possibly wrong module config and set synth. default imports', () => {
    const target = logTargetMock()
    target.clear()
    const cs = createConfigSet({
      tsJestConfig: {
        tsconfig: { module: 'ES6', esModuleInterop: false } as any,
        diagnostics: { warnOnly: true, pretty: false },
      },
      resolve: null,
    })
    expect(cs.parsedTsConfig.options).toMatchObject({
      module: ts.ModuleKind.CommonJS,
      allowSyntheticDefaultImports: true,
      esModuleInterop: false,
    })
    expect(target.lines.warn.join()).toMatchInlineSnapshot(`
      "[level:40] message TS151001: If you have issues related to imports, you should consider setting \`esModuleInterop\` to \`true\` in your TypeScript configuration file (usually \`tsconfig.json\`). See https://blogs.msdn.microsoft.com/typescript/2018/01/31/announcing-typescript-2-7/#easier-ecmascript-module-interoperability for more information.
      "
    `)
  })

  it('should not warn neither set synth. default imports if using babel', () => {
    const target = logTargetMock()
    target.clear()
    const cs = createConfigSet({
      tsJestConfig: {
        tsconfig: { module: 'amd', esModuleInterop: false } as any,
        diagnostics: { warnOnly: true, pretty: false },
        babelConfig: { babelrc: false },
      },
      resolve: null,
    })
    expect(cs.parsedTsConfig.options).toMatchObject({
      module: ts.ModuleKind.AMD,
      esModuleInterop: false,
    })
    expect(cs.parsedTsConfig.options.allowSyntheticDefaultImports).toBeFalsy()
  })
}) // parsedTsConfig

describe('compilerModule', () => {
  test('should return typescript compiler module when no custom compiler module is specified', () => {
    const compilerModule = createConfigSet().compilerModule

    expect(compilerModule).toBeDefined()
    expect(typeof compilerModule).toBe('object')
  })

  test('should return custom compiler module when specifying via config', () => {
    expect(() =>
      createConfigSet({
        tsJestConfig: {
          compiler: 'ttypescript',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      "Unable to load the module \\"ttypescript\\". Using \\"ts-jest\\" requires this package to be installed. To fix it:
          ↳ install \\"ttypescript\\": \`npm i -D ttypescript\` (or \`yarn add --dev ttypescript\`)"
    `)
  })
}) // compilerModule

describe('customTransformers', () => {
  const logger = testing.createLoggerMock()

  it.each([
    {},
    {
      before: ['dummy-transformer'],
    },
    {
      after: ['dummy-transformer'],
    },
    {
      afterDeclarations: ['dummy-transformer'],
    },
    {
      before: [
        {
          path: 'dummy-transformer',
          options: Object.create(null),
        },
      ],
    },
  ])('should return an object containing all resolved transformers', (data) => {
    const cs = createConfigSet({
      jestConfig: {
        rootDir: 'src',
        cwd: 'src',
      } as any,
      tsJestConfig: {
        astTransformers: data,
      },
      resolve: null,
    })

    expect(cs.customTransformers).toMatchSnapshot()
  })

  it('should return an object containing all resolved transformers when astTransformers config is an array', () => {
    expect(
      createConfigSet({
        jestConfig: {
          rootDir: 'src',
          cwd: 'src',
        } as any,
        logger,
        tsJestConfig: {
          astTransformers: ['dummy-transformer'],
        },
        resolve: null,
      }).customTransformers,
    ).toMatchInlineSnapshot(`
      Object {
        "before": Array [
          [Function],
          [Function],
        ],
      }
    `)
  })
})

describe('tsCompiler', () => {
  it('should be a compiler object', () => {
    const cs = createConfigSet({
      jestConfig: {
        testRegex: [],
        testMatch: [],
      },
      tsJestConfig: { tsconfig: false } as any,
    })
    const compiler = cs.tsCompiler
    expect(compiler.cwd).toBe(cs.cwd)
    expect(typeof compiler.compile).toBe('function')
  })
}) // tsCompiler

describe('babelJestTransformer', () => {
  it('should return babelJestTransformer without babelConfig option', () => {
    const cs = createConfigSet({
      jestConfig: { rootDir: 'src', cwd: 'src' },
      resolve: null,
    })
    const babelJest = cs.babelJestTransformer as Transformer

    expect(cs.babelConfig).toBeUndefined()
    expect(babelJest).toBeUndefined()
  })

  it('should return babelJestTransformer with babalConfig is true', () => {
    const cs = createConfigSet({
      jestConfig: {
        rootDir: 'src',
        cwd: 'src',
        globals: {
          'ts-jest': {
            babelConfig: true,
          },
        },
      },
      resolve: null,
    })
    const babelJest = cs.babelJestTransformer as Transformer

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const babelCfg = cs.babelConfig!
    expect(babelCfg.cwd).toEqual(cs.cwd)
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })

  it('should return babelJestTransformer with non javascript file path', () => {
    const FILE = 'src/__mocks__/.babelrc-foo'
    const cs = createConfigSet({
      jestConfig: {
        globals: {
          'ts-jest': {
            babelConfig: FILE,
          },
        },
      },
      resolve: null,
    })
    const babelJest = cs.babelJestTransformer as Transformer

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const babelCfg = cs.babelConfig!
    expect(babelCfg.cwd).toEqual(cs.cwd)
    expect(babelCfg.presets).toMatchInlineSnapshot(`
      Array [
        "@babel/preset-env",
        "@babel/preset-typescript",
        "@babel/preset-react",
      ]
    `)
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })

  it('should return babelJestTransformer with javascript file path', () => {
    const FILE = 'src/__mocks__/babel-foo.config.js'
    const cs = createConfigSet({
      jestConfig: {
        globals: {
          'ts-jest': {
            babelConfig: FILE,
          },
        },
      },
      resolve: null,
    })
    const babelJest = cs.babelJestTransformer as Transformer

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const babelCfg = cs.babelConfig!
    expect(babelCfg.cwd).toEqual(cs.cwd)
    expect(babelCfg.presets).toMatchInlineSnapshot(`
      Array [
        "@babel/preset-env",
        "@babel/preset-typescript",
        "@babel/preset-react",
      ]
    `)
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })

  it('should return babelJestTransformer with loaded config object', () => {
    const babelConfig = require('../__mocks__/babel-foo.config')
    const cs = createConfigSet({
      jestConfig: {
        globals: {
          'ts-jest': {
            babelConfig,
          },
        },
      },
      resolve: null,
    })
    const babelJest = cs.babelJestTransformer as Transformer

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const babelCfg = cs.babelConfig!
    expect(babelCfg.cwd).toEqual(cs.cwd)
    expect(babelCfg.presets).toMatchInlineSnapshot(`
      Array [
        "@babel/preset-env",
        "@babel/preset-typescript",
        "@babel/preset-react",
      ]
    `)
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })

  it('should return babelJestTransformer with inline config', () => {
    const CONFIG = { comments: true }
    const cs = createConfigSet({
      jestConfig: {
        globals: {
          'ts-jest': {
            babelConfig: CONFIG,
          },
        },
      },
      resolve: null,
    })
    const babelJest = cs.babelJestTransformer as Transformer

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const babelCfg = cs.babelConfig!
    expect(babelCfg.cwd).toEqual(cs.cwd)
    expect(babelCfg.comments).toEqual(true)
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })
}) // babelJestTransformer

describe('tsCacheDir', () => {
  const cacheName = 'configSetTmp'
  const cacheDir = join(process.cwd(), cacheName)
  const partialTsJestCacheDir = join(cacheDir, 'ts-jest')

  it.each([undefined, Object.create(null)])(
    'should return value from which is the combination of ts jest config and jest config when running test with cache',
    (data) => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        createConfigSet({
          jestConfig: {
            cache: true,
            cacheDirectory: cacheDir,
            globals: data,
          },
          resolve: null,
        }).tsCacheDir!.indexOf(partialTsJestCacheDir),
      ).toEqual(0)
    },
  )

  it('should return undefined when running test without cache', () => {
    expect(createConfigSet({ resolve: null }).tsCacheDir).toBeUndefined()
  })

  it('return value with the real version of dependencies in package.json when running test with cache', () => {
    const pkg = {
      optionalDependencies: { opt: '1.2.3' },
      peerDependencies: { peer: '1.2.4' },
      devDependencies: { dev: '1.2.5' },
      dependencies: { std: '1.2.6' },
    }
    const realVersions: any = {
      peer: '0.1.0',
      dev: '4.3.2',
      std: '9.10.2',
      opt: '2.0.2',
    }
    const mock: jest.MockInstance<string | undefined, [string]> = mocked(getPackageVersion).mockImplementation(
      (moduleName: string) => realVersions[moduleName],
    )
    const cs = createConfigSet({
      jestConfig: {
        cache: true,
        cacheDirectory: cacheDir,
        globals: {
          'ts-jest': { tsconfig: false },
        },
      },
      projectPackageJson: pkg,
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(cs.tsCacheDir!.indexOf(partialTsJestCacheDir)).toEqual(0)

    mock.mockRestore()
  })
})

describe('tsJestDigest', () => {
  it('should be the package digest', () => {
    expect(createConfigSet().tsJestDigest).toBe(MY_DIGEST)
  })
}) // tsJestDigest

describe('hooks', () => {
  it('should return empty object when environment variable TS_JEST_HOOKS is undefined', () => {
    expect(createConfigSet().hooks).toEqual({})
  })

  it('should return value when environment variable TS_JEST_HOOKS is defined', () => {
    process.env.TS_JEST_HOOKS = './foo'
    expect(createConfigSet().hooks).toBeDefined()
  })
}) // hooks

describe('isTestFile', () => {
  it.each([
    {
      jestConfig: {
        testRegex: [{}],
        testMatch: [],
      } as any,
    },
    {
      jestConfig: {
        testMatch: [],
        testRegex: [/.*\.(spec|test)\.[jt]sx?$/],
      } as any,
    },
    {
      jestConfig: {
        testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
        testRegex: [],
      } as any,
    },
    {
      jestConfig: {
        testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
        testRegex: ['**/?(*.)+(foo|bar).[tj]s?(x)'],
      } as any,
    },
  ])('should return a boolean value whether the file matches test pattern', (config) => {
    expect(createConfigSet(config).isTestFile('foo.spec.ts')).toMatchSnapshot()
  })
}) // isTestFile

describe('shouldStringifyContent', () => {
  it('should return correct value is defined', () => {
    const cs = createConfigSet({ tsJestConfig: { tsconfig: false, stringifyContentPathRegex: '\\.str$' } as any })
    expect(cs.shouldStringifyContent('/foo/bar.ts')).toBe(false)
    expect(cs.shouldStringifyContent('/foo/bar.str')).toBe(true)
  })

  it('should return correct value when stringifyContentPathRegex is undefined', () => {
    const cs = createConfigSet({ tsJestConfig: { tsconfig: false } as any })
    expect(cs.shouldStringifyContent('/foo/bar.ts')).toBe(false)
  })
}) // shouldStringifyContent

describe('raiseDiagnostics', () => {
  const logger = testing.createLoggerMock()

  describe('with warnOnly config', () => {
    const filterDiagnostics = jest.fn((list) => list)
    const makeDiagnostic = ({
      messageText = 'foo',
      code = 9999,
      category = ts.DiagnosticCategory.Warning,
    }: Partial<ts.Diagnostic> = {}): ts.Diagnostic => ({ messageText, code, category } as any)

    it('should throw when warnOnly is false', () => {
      const cs = createConfigSet({ filterDiagnostics, logger, tsJestConfig: { diagnostics: { pretty: false } } })

      expect(() => cs.raiseDiagnostics([])).not.toThrow()
      expect(() => cs.raiseDiagnostics([makeDiagnostic()])).toThrowErrorMatchingInlineSnapshot(`"warning TS9999: foo"`)
      expect(() => cs.raiseDiagnostics([makeDiagnostic({ category: ts.DiagnosticCategory.Message })])).not.toThrow()
    })

    it('should not throw when warnOnly is true', () => {
      const cs = createConfigSet({
        filterDiagnostics,
        logger,
        tsJestConfig: { diagnostics: { warnOnly: true, pretty: false } },
      })

      logger.target.clear()
      expect(() => cs.raiseDiagnostics([])).not.toThrow()
      expect(() => cs.raiseDiagnostics([makeDiagnostic()])).not.toThrow()
      expect(logger.target.lines).toMatchInlineSnapshot(`
        Array [
          "[level:40] warning TS9999: foo
        ",
        ]
      `)
    })
  })

  describe("diagnostics don't contain source file", () => {
    const makeDiagnostic = ({
      messageText = 'foo',
      code = 9999,
      category = ts.DiagnosticCategory.Warning,
    }: Partial<ts.Diagnostic> = {}): ts.Diagnostic => ({ messageText, code, category } as any)
    it('should throw when diagnostics contains file path and pathRegex config matches file path', () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { pathRegex: 'src/__mocks__/index.ts', pretty: false } },
      })
      logger.target.clear()

      expect(() =>
        cs.raiseDiagnostics([makeDiagnostic()], 'src/__mocks__/index.ts', logger),
      ).toThrowErrorMatchingInlineSnapshot(`"warning TS9999: foo"`)
    })

    it("should not throw when diagnostics contains file path and pathRegex config doesn't match file path", () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { warnOnly: true, pathRegex: '/bar/', pretty: false } },
      })
      logger.target.clear()

      expect(() => cs.raiseDiagnostics([makeDiagnostic()], 'src/__mocks__/index.ts', logger)).not.toThrow()
    })
  })

  describe('diagnostics contain source file', () => {
    const program: ts.Program = ts.createProgram({
      options: {
        module: ts.ModuleKind.CommonJS,
      },
      rootNames: ['src/__mocks__/index.ts'],
    })
    const makeDiagnostic = ({
      messageText = 'foo',
      code = 9999,
      category = ts.DiagnosticCategory.Warning,
      file = program.getSourceFiles().find((sourceFile) => sourceFile.fileName === 'src/__mocks__/index.ts'),
    }: Partial<ts.Diagnostic> = {}): ts.Diagnostic => ({ messageText, code, category, file } as any)

    it("should not throw when pathRegex config doesn't match source file path", () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { pathRegex: '/foo/', pretty: false, ignoreCodes: [1111] } },
      })
      logger.target.clear()

      expect(() => cs.raiseDiagnostics([makeDiagnostic()])).not.toThrow()
    })

    it("should throw when pathRegex config doesn't match source file path", () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { pathRegex: 'src/__mocks__/index.ts', pretty: false } },
      })
      logger.target.clear()

      expect(() => cs.raiseDiagnostics([makeDiagnostic()])).toThrowErrorMatchingInlineSnapshot(
        `"Debug Failure. False expression: position cannot precede the beginning of the file"`,
      )
    })
  })
}) // raiseDiagnostics

describe('shouldReportDiagnostics', () => {
  it('should return correct value', () => {
    let cs = createConfigSet({ tsJestConfig: { tsconfig: false, diagnostics: { pathRegex: '/foo/' } } as any })
    expect(cs.shouldReportDiagnostics('/foo/index.ts')).toBe(true)
    expect(cs.shouldReportDiagnostics('/bar/index.ts')).toBe(false)
    cs = createConfigSet({ tsJestConfig: { tsconfig: false } as any })
    expect(cs.shouldReportDiagnostics('/foo/index.ts')).toBe(true)
    expect(cs.shouldReportDiagnostics('/bar/index.ts')).toBe(true)
  })
}) // shouldReportDiagnostics

describe('resolvePath', () => {
  it('should resolve paths', () => {
    const cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path, { throwIfMissing: false })
    expect(doResolve('bar.js')).toBe(resolve('/cwd/bar.js'))
    expect(doResolve('./bar.js')).toBe(resolve('/cwd/./bar.js'))
    expect(doResolve('<rootDir>bar.js')).toBe(resolve('/root/bar.js'))
    expect(doResolve('<rootDir>/bar.js')).toBe(resolve('/root//bar.js'))
  })
  it('should resolve node paths', () => {
    const cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path, { throwIfMissing: false, nodeResolve: true })
    expect(doResolve('json5')).toBe(resolve(__dirname, '../../node_modules/json5', require('json5/package.json').main))
    expect(doResolve('./bar.js')).toBe(resolve('/cwd/bar.js'))
    expect(doResolve('<rootDir>bar.js')).toBe(resolve('/root/bar.js'))
    expect(doResolve('<rootDir>/bar.js')).toBe(resolve('/root//bar.js'))
  })
  it('should throw for invalid paths', () => {
    const cs = createConfigSet({ jestConfig: { rootDir: __dirname, cwd: __dirname } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path)
    expect(() => doResolve('bar.js')).toThrow()
    expect(() => doResolve('./bar.js')).toThrow()
    expect(() => doResolve('<rootDir>bar.js')).toThrow()
    expect(() => doResolve('<rootDir>/bar.js')).toThrow()
  })
}) // resolvePath

describe('readTsConfig', () => {
  let findConfig!: jest.SpyInstance<string | undefined>
  let readConfig!: jest.SpyInstance<{ config?: any; error?: ts.Diagnostic }>
  let parseConfig!: jest.SpyInstance<ts.ParsedCommandLine>
  let cs!: ConfigSet

  beforeAll(() => {
    findConfig = jest.spyOn(ts, 'findConfigFile')
    readConfig = jest.spyOn(ts, 'readConfigFile')
    parseConfig = jest.spyOn(ts, 'parseJsonConfigFileContent')
  })

  afterAll(() => {
    findConfig.mockRestore()
    readConfig.mockRestore()
    parseConfig.mockRestore()
  })

  describe('cannot resolve configFileName', () => {
    beforeEach(() => {
      findConfig.mockReturnValue(undefined)
      readConfig.mockReturnValue({
        error: {
          code: 404,
        } as any,
      })
    })

    afterEach(() => {
      findConfig.mockClear()
      readConfig.mockClear()
      parseConfig.mockClear()
    })

    it('should use correct paths when searching', () => {
      cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any })

      const conf = cs.parsedTsConfig
      expect(conf.options.configFilePath).toBeUndefined()
      expect(readConfig).not.toHaveBeenCalled()
      expect(parseConfig.mock.calls[0][2]).toBe('/root')
      expect(parseConfig.mock.calls[0][4]).toBeUndefined()
    })

    it('should use given tsconfig path', () => {
      jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce('/foo/tsconfig.bar.json')
      jest.spyOn(ConfigSet.prototype, 'raiseDiagnostics').mockImplementationOnce(() => {})

      cs = createConfigSet({
        jestConfig: {
          rootDir: '/root',
          cwd: '/cwd',
          globals: { 'ts-jest': { tsconfig: 'tsconfig.bar.json' } },
        } as any,
      })

      const conf = cs.parsedTsConfig
      expect(conf.options.configFilePath).toBeUndefined()
      expect(findConfig).not.toBeCalled()
      expect(readConfig.mock.calls[0][0]).toBe('/foo/tsconfig.bar.json')
      expect(parseConfig).not.toHaveBeenCalled()
    })
  })

  describe('resolve configFileName normally', () => {
    beforeEach(() => {
      findConfig.mockImplementation((p: string) => `${p}/tsconfig.json`)
      readConfig.mockImplementation((p) => ({ config: { path: p, compilerOptions: {} } }))
    })

    afterEach(() => {
      findConfig.mockClear()
      readConfig.mockClear()
    })

    describe('module in tsConfig is not the same as forced module and esModuleInterop is not in tsConfig', () => {
      beforeEach(() => {
        parseConfig.mockImplementation((conf: any) => ({
          options: {
            ...conf,
            module: ts.ModuleKind.AMD,
          },
          fileNames: [],
          errors: [],
        }))
      })

      afterEach(() => {
        parseConfig.mockClear()
      })

      it('should use correct paths when searching', () => {
        const tscfgPathStub = '/root/tsconfig.json'

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig.mock.calls[0][0]).toBe('/root')
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/root')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.options.allowSyntheticDefaultImports).toEqual(true)
        expect(conf.errors).toMatchSnapshot()
      })

      it('should use given tsconfig path', () => {
        const tscfgPathStub = '/foo/tsconfig.bar.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce(tscfgPathStub)

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.bar.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig).not.toBeCalled()
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/foo')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.errors).toMatchSnapshot()
      })
    })

    describe('module in tsConfig is not the same as forced module and allowSyntheticDefaultImports is false in tsConfig', () => {
      beforeEach(() => {
        parseConfig.mockImplementation((conf: any) => ({
          options: {
            ...conf,
            module: ts.ModuleKind.AMD,
            allowSyntheticDefaultImports: false,
          },
          fileNames: [],
          errors: [],
        }))
      })

      afterEach(() => {
        parseConfig.mockClear()
      })

      it('should use correct paths when searching', () => {
        const tscfgPathStub = '/root/tsconfig.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce('')

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig.mock.calls[0][0]).toBe('/root')
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/root')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.options.allowSyntheticDefaultImports).toEqual(true)
        expect(conf.errors).toMatchSnapshot()
      })

      it('should use given tsconfig path', () => {
        const tscfgPathStub = '/foo/tsconfig.bar.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce(tscfgPathStub)

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.bar.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig).not.toBeCalled()
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/foo')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.errors).toMatchSnapshot()
      })
    })

    describe('module in tsConfig is the same as forced module and esModuleInterop true is in tsConfig', () => {
      beforeEach(() => {
        parseConfig.mockImplementation((conf: any) => ({
          options: {
            ...conf,
            module: ts.ModuleKind.ESNext,
            esModuleInterop: true,
          },
          fileNames: [],
          errors: [],
        }))
      })

      afterEach(() => {
        parseConfig.mockClear()
      })

      it('should use correct paths when searching', () => {
        const tscfgPathStub = '/root/tsconfig.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce('')

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig.mock.calls[0][0]).toBe('/root')
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/root')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.options.allowSyntheticDefaultImports).toBeUndefined()
        expect(conf.errors).toEqual([])
      })

      it('should use given tsconfig path', () => {
        const tscfgPathStub = '/foo/tsconfig.bar.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce(tscfgPathStub)

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.bar.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig).not.toBeCalled()
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/foo')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.errors).toEqual([])
      })
    })

    describe('module in tsConfig is the same as forced module and allowSyntheticDefaultImports true is in tsConfig', () => {
      beforeEach(() => {
        parseConfig.mockImplementation((conf: any) => ({
          options: {
            ...conf,
            module: ts.ModuleKind.ESNext,
            allowSyntheticDefaultImports: true,
          },
          fileNames: [],
          errors: [],
        }))
      })

      afterEach(() => {
        parseConfig.mockClear()
      })

      it('should use correct paths when searching', () => {
        const tscfgPathStub = '/root/tsconfig.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce('')

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig.mock.calls[0][0]).toBe('/root')
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/root')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.errors).toEqual([])
        expect(conf.options.allowSyntheticDefaultImports).toEqual(true)
      })

      it('should use given tsconfig path', () => {
        const tscfgPathStub = '/foo/tsconfig.bar.json'
        jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce(tscfgPathStub)

        cs = createConfigSet({
          jestConfig: {
            rootDir: '/root',
            cwd: '/cwd',
            globals: { 'ts-jest': { tsconfig: 'tsconfig.bar.json' } },
          } as any,
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig).not.toBeCalled()
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/foo')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
        expect(conf.errors).toEqual([])
        expect(conf.options.allowSyntheticDefaultImports).toEqual(true)
      })
    })
  })
}) // readTsConfig

describe('diagnostics', () => {
  it.each([
    { diagnostics: true },
    { diagnostics: false },
    {
      diagnostics: {
        ignoreCodes: '10, 25',
        pathRegex: '\\.test\\.ts',
        pretty: false,
      },
    },
    {
      diagnostics: {
        ignoreCodes: ['10', 25],
        pretty: false,
        pathRegex: RegExp('\\.test\\.ts'),
      },
    },
    { diagnostics: { warnOnly: true } },
    { diagnostics: { warnOnly: false } },
  ])('should handle different diagnostics config', (data) => {
    expect(createConfigSet({ tsJestConfig: data })).toBeDefined()
  })

  it.each([
    '10',
    10,
    'TS2571',
    '1009, TS2571, 4072',
    [1009, 'TS2571', '6031', 'TS6031, 10', NaN, 'undefined', 'null', ''],
    '',
    NaN,
  ])('should handle various kinds of ignoreCodes', (ignoreCodes) => {
    expect(createConfigSet({ tsJestConfig: { diagnostics: { ignoreCodes } } })).toBeDefined()
  })
}) // diagnostics
