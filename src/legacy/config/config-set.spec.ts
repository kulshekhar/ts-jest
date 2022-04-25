import { join, resolve } from 'path'

import type { Transformer } from '@jest/transform'
import { LogLevels, testing } from 'bs-logger'
import ts from 'typescript'

import { createConfigSet } from '../../__helpers__/fakers'
import { logTargetMock } from '../../__helpers__/mocks'
import type { AstTransformerDesc, TsJestGlobalOptions } from '../../types'
import { stringify } from '../../utils'
import * as _backports from '../../utils/backports'
import { getPackageVersion } from '../../utils/get-package-version'
import { normalizeSlashes } from '../../utils/normalize-slashes'
import { sha1 } from '../../utils/sha1'

import { ConfigSet, MY_DIGEST } from './config-set'

jest.mock('../../utils/backports')
jest.mock('../index')
jest.mock('../../utils/get-package-version')

const backports = jest.mocked(_backports)

backports.backportJestConfig.mockImplementation((_, config) => ({
  ...config,
  __backported: true,
}))

beforeEach(() => {
  jest.clearAllMocks()
})

test('should create a default fallback jest config when jest config is undefined', () => {
  // @ts-expect-error testing purpose
  expect(new ConfigSet(undefined)._jestCfg).toBeDefined()
})

describe('parsedTsConfig', () => {
  const get = (tsJest?: TsJestGlobalOptions) => createConfigSet({ tsJestConfig: tsJest }).parsedTsConfig

  it('should read file list from default tsconfig', () => {
    // since the default is to lookup for tsconfig,
    // we should have this file in the list
    expect(get().fileNames).toContain(normalizeSlashes(__filename))
  })

  it('should include compiler config from base config', () => {
    expect(get({ tsconfig: { target: 'esnext' } }).options.target).toBe(ts.ScriptTarget.ESNext)
  })

  it('should fallback to ES2015 as default target and CommonJS as default module when no target or module defined in tsconfig', () => {
    const compilerOptions = get({ tsconfig: 'src/__mocks__/tsconfig-mocks.json' }).options

    expect(compilerOptions.target).toBe(ts.ScriptTarget.ES2015)
    expect(compilerOptions.module).toBe(ts.ModuleKind.CommonJS)
  })

  it('should override some options', () => {
    expect(get({ tsconfig: { inlineSources: false, outDir: 'build' } }).options).toMatchObject({
      inlineSources: true,
    })
  })

  it('should be able to read extends', () => {
    const cs = createConfigSet({
      tsJestConfig: { tsconfig: 'tsconfig.build.json' },
      resolve: null,
    })

    expect(cs.parsedTsConfig.options).toMatchObject({
      module: ts.ModuleKind.CommonJS,
      skipLibCheck: true,
    })
  })

  it('should warn about possibly wrong module config and set synth. default imports with module None/AMD/UMD/System', () => {
    const target = logTargetMock()
    target.clear()
    const cs = createConfigSet({
      tsJestConfig: {
        tsconfig: { module: 'AMD', esModuleInterop: false },
        diagnostics: { warnOnly: true, pretty: false },
      },
      resolve: null,
    })

    expect(cs.parsedTsConfig.options).toMatchObject({
      module: ts.ModuleKind.AMD,
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
        tsconfig: { module: 'amd', esModuleInterop: false },
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
  test('should show warning log when missing version and name', () => {
    const logger = testing.createLoggerMock()
    createConfigSet({
      logger,
      jestConfig: {
        rootDir: 'src',
        cwd: 'src',
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      tsJestConfig: {
        astTransformers: {
          before: ['hummy-transformer'],
        },
      },
      resolve: null,
    })

    expect(
      logger.target.filteredLines(LogLevels.warn).map((logLine) => logLine.substring(0, logLine.indexOf('>') + 1)),
    ).toMatchSnapshot()
  })

  test.each([
    {},
    {
      before: ['dummy-transformer'],
    },
    {
      before: ['__mocks__/funny-transformer.ts'],
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
    const logger = testing.createLoggerMock()
    const cs = createConfigSet({
      logger,
      jestConfig: {
        rootDir: 'src',
        cwd: 'src',
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      tsJestConfig: {
        astTransformers: data,
      },
      resolve: null,
    })

    expect(cs.resolvedTransformers).toMatchSnapshot()
  })
})

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

  it('should return babelJestTransformer with babelConfig is true', () => {
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
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })

  it.each([
    {
      path: 'src/__mocks__/.babelrc-foo',
      rootDir: './',
    },
    {
      path: '<rootDir>/.babelrc-foo',
      rootDir: 'src/__mocks__/',
    },
  ])('should return babelJestTransformer with non javascript file path', (data) => {
    const cs = createConfigSet({
      jestConfig: {
        globals: {
          'ts-jest': {
            babelConfig: data.path,
          },
        },
        rootDir: data.rootDir,
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
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })

  it.each(['src/__mocks__/babel-foo.config.js', 'src/__mocks__/babel-foo.config.cjs'])(
    'should return babelJestTransformer with javascript file path',
    (babelFilePath) => {
      const cs = createConfigSet({
        jestConfig: {
          globals: {
            'ts-jest': {
              babelConfig: babelFilePath,
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
      expect(typeof babelJest.getCacheKey).toBe('function')
      expect(typeof babelJest.process).toBe('function')
    },
  )

  it('should return babelJestTransformer with loaded config object', () => {
    /* eslint-disable-next-line jest/no-mocks-import */
    const babelConfig = require('../../__mocks__/babel-foo.config')
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
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })
}) // babelJestTransformer

describe('tsCacheDir', () => {
  const cacheName = 'configSetTmp'
  const cacheDir = join(cacheName)
  const partialTsJestCacheDir = join(cacheDir, 'ts-jest')

  it.each([
    undefined,
    {
      'ts-jest': {
        astTransformers: {
          before: ['hummy-transformer'],
        },
      },
    },
  ])(
    'should return value from which is the combination of ts jest config and jest config when running test with cache',
    (data) => {
      const configSet = createConfigSet({
        jestConfig: {
          cache: true,
          cacheDirectory: cacheDir,
          globals: data,
        },
        resolve: null,
      })

      expect(configSet.cacheSuffix).toEqual(
        sha1(
          stringify({
            version: configSet.compilerModule.version,
            digest: configSet.tsJestDigest,
            babelConfig: configSet.babelConfig,
            tsconfig: {
              options: configSet.parsedTsConfig.options,
              raw: configSet.parsedTsConfig.raw,
            },
            isolatedModules: configSet.isolatedModules,
            // @ts-expect-error testing purpose
            diagnostics: configSet._diagnostics,
            transformers: Object.values(configSet.resolvedTransformers)
              .reduce((prevVal, currentVal) => [...prevVal, currentVal])
              .map((transformer: AstTransformerDesc) => `${transformer.name}-${transformer.version}`),
          }),
        ),
      )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(configSet.tsCacheDir!.indexOf(partialTsJestCacheDir)).toEqual(0)
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
    const realVersions: Record<string, string> = {
      peer: '0.1.0',
      dev: '4.3.2',
      std: '9.10.2',
      opt: '2.0.2',
    }
    const mock: jest.MockInstance<string | undefined, [string]> = jest
      .mocked(getPackageVersion)
      .mockImplementation((moduleName: string) => realVersions[moduleName])
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

describe('isTestFile', () => {
  it.each([
    {
      jestConfig: {
        testRegex: [{}],
        testMatch: [],
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    {
      jestConfig: {
        testMatch: [],
        testRegex: [/.*\.(spec|test)\.[jt]sx?$/],
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    {
      jestConfig: {
        testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
        testRegex: [],
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    {
      jestConfig: {
        testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
        testRegex: ['**/?(*.)+(foo|bar).[tj]s?(x)'],
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  ])('should return a boolean value whether the file matches test pattern', (config) => {
    expect(createConfigSet(config).isTestFile('foo.spec.ts')).toMatchSnapshot()
  })
}) // isTestFile

describe('shouldStringifyContent', () => {
  it('should return correct value is defined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cs1 = createConfigSet({ tsJestConfig: { tsconfig: false, stringifyContentPathRegex: '\\.str$' } as any })

    expect(cs1.shouldStringifyContent('/foo/bar.ts')).toBe(false)
    expect(cs1.shouldStringifyContent('/foo/bar.str')).toBe(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cs2 = createConfigSet({ tsJestConfig: { tsconfig: false, stringifyContentPathRegex: /\.str$/ } as any })

    expect(cs2.shouldStringifyContent('/foo/bar.ts')).toBe(false)
    expect(cs2.shouldStringifyContent('/foo/bar.str')).toBe(true)
  })

  it('should return correct value when stringifyContentPathRegex is undefined', () => {
    const cs = createConfigSet({ tsJestConfig: { tsconfig: false } })

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
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Partial<ts.Diagnostic> = {}): ts.Diagnostic => ({ messageText, code, category } as any)

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
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Partial<ts.Diagnostic> = {}): ts.Diagnostic => ({ messageText, code, category } as any)
    test('should not throw when diagnostics contains file path and exclude config matches file path', () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { exclude: ['src/__mocks__/index.ts'], pretty: false } },
      })
      logger.target.clear()

      expect(() => cs.raiseDiagnostics([makeDiagnostic()], 'src/__mocks__/index.ts', logger)).not.toThrow()
    })

    test("should throw when diagnostics contains file path and exclude config doesn't match file path", () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { exclude: ['/bar/'], pretty: false } },
      })
      cs.compilerModule.formatDiagnostics = jest.fn().mockReturnValueOnce('warning TS9999: foo')
      logger.target.clear()

      expect(() =>
        cs.raiseDiagnostics([makeDiagnostic()], 'src/__mocks__/index.ts', logger),
      ).toThrowErrorMatchingInlineSnapshot(`"warning TS9999: foo"`)
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
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Partial<ts.Diagnostic> = {}): ts.Diagnostic => ({ messageText, code, category, file } as any)

    test(`should throw when exclude config doesn't match source file path`, () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { exclude: ['/foo/'], pretty: false, ignoreCodes: [1111] } },
      })
      cs.compilerModule.formatDiagnostics = jest.fn().mockReturnValueOnce('warning TS9999: foo')
      logger.target.clear()

      expect(() => cs.raiseDiagnostics([makeDiagnostic()])).toThrowErrorMatchingInlineSnapshot(`"warning TS9999: foo"`)
    })

    it(`should not throw when exclude config doesn't match source file path`, () => {
      const cs = createConfigSet({
        logger,
        tsJestConfig: { diagnostics: { exclude: ['src/__mocks__/index.ts'], pretty: false } },
      })
      logger.target.clear()

      expect(() => cs.raiseDiagnostics([makeDiagnostic()])).not.toThrow()
    })
  })
}) // raiseDiagnostics

describe('shouldReportDiagnostics', () => {
  test('should return correct value for ts/tsx files', () => {
    let cs = createConfigSet({
      tsJestConfig: {
        tsconfig: false,
        diagnostics: { exclude: ['**/foo/*.ts', 'NOTHING'] },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })

    expect(cs.shouldReportDiagnostics('/foo/index.ts')).toBe(false)
    expect(cs.shouldReportDiagnostics('/bar/index.tsx')).toBe(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cs = createConfigSet({ tsJestConfig: { tsconfig: false } as any })

    expect(cs.shouldReportDiagnostics('/foo/index.ts')).toBe(true)
    expect(cs.shouldReportDiagnostics('/bar/index.tsx')).toBe(true)
  })

  test('should return correct value for js/jsx files with checkJs compiler option', () => {
    let cs = createConfigSet({
      tsJestConfig: {
        tsconfig: { checkJs: false },
        diagnostics: { exclude: ['foo/*'] },
      },
    })

    expect(cs.shouldReportDiagnostics('/foo/index.js')).toBe(false)
    expect(cs.shouldReportDiagnostics('/foo/index.jsx')).toBe(false)

    cs = createConfigSet({
      tsJestConfig: {
        tsconfig: { checkJs: true },
        diagnostics: { exclude: ['**/foo/*.js', '**/foo/*.jsx'] },
      },
    })

    expect(cs.shouldReportDiagnostics('/foo/index.js')).toBe(false)
    expect(cs.shouldReportDiagnostics('/foo/index.jsx')).toBe(false)
  })
}) // shouldReportDiagnostics

describe('resolvePath', () => {
  it('should resolve paths', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path, { throwIfMissing: false })
    expect(doResolve('bar.js')).toBe(resolve('/cwd/bar.js'))
    expect(doResolve('./bar.js')).toBe(resolve('/cwd/./bar.js'))
    expect(doResolve('<rootDir>bar.js')).toBe(resolve('/root/bar.js'))
    expect(doResolve('<rootDir>/bar.js')).toBe(resolve('/root//bar.js'))
  })
  it('should resolve node paths', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path, { throwIfMissing: false, nodeResolve: true })
    expect(doResolve('json5')).toBe(
      resolve(__dirname, '../../../node_modules/json5', require('json5/package.json').main),
    )
    expect(doResolve('./bar.js')).toBe(resolve('/cwd/bar.js'))
    expect(doResolve('<rootDir>bar.js')).toBe(resolve('/root/bar.js'))
    expect(doResolve('<rootDir>/bar.js')).toBe(resolve('/root//bar.js'))
  })
  it('should throw for invalid paths', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cs = createConfigSet({ jestConfig: { rootDir: __dirname, cwd: __dirname } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path)
    expect(() => doResolve('bar.js')).toThrow()
    expect(() => doResolve('./bar.js')).toThrow()
    expect(() => doResolve('<rootDir>bar.js')).toThrow()
    expect(() => doResolve('<rootDir>/bar.js')).toThrow()
  })
}) // resolvePath

describe('_resolveTsConfig', () => {
  let findConfig!: jest.SpyInstance<string | undefined>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      })
    })

    afterEach(() => {
      findConfig.mockClear()
      readConfig.mockClear()
      parseConfig.mockClear()
    })

    it('should use correct paths when searching', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any })

      const conf = cs.parsedTsConfig
      expect(conf.options.configFilePath).toBeUndefined()
      expect(readConfig).not.toHaveBeenCalled()
      expect(parseConfig.mock.calls[0][2]).toBe('/root')
      expect(parseConfig.mock.calls[0][4]).toBeUndefined()
    })

    it('should use given tsconfig path', () => {
      jest.spyOn(ConfigSet.prototype, 'resolvePath').mockReturnValueOnce('/foo/tsconfig.bar.json')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(ConfigSet.prototype, 'raiseDiagnostics').mockImplementationOnce(() => {})

      cs = createConfigSet({
        jestConfig: {
          rootDir: '/root',
          cwd: '/cwd',
          globals: { 'ts-jest': { tsconfig: 'tsconfig.bar.json' } },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
            extensionsToTreatAsEsm: ['.ts'],
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        })

        const conf = cs.parsedTsConfig
        expect(conf.options.path).toBe(tscfgPathStub)
        expect(findConfig.mock.calls[0][0]).toBe('/root')
        expect(readConfig.mock.calls[0][0]).toBe(tscfgPathStub)
        expect(parseConfig.mock.calls[0][2]).toBe('/root')
        expect(parseConfig.mock.calls[0][4]).toBe(tscfgPathStub)
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
            extensionsToTreatAsEsm: ['.ts'],
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
            extensionsToTreatAsEsm: ['.ts'],
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
            extensionsToTreatAsEsm: ['.ts'],
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
        exclude: ['\\.test\\.ts'],
        pretty: false,
      },
    },
    {
      diagnostics: {
        ignoreCodes: ['10', 25],
        pretty: false,
        exclude: ['\\.test\\.ts'],
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
