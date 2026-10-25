import path from 'node:path'

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { vol } from 'memfs'
import type { PackageJson } from 'type-fest'
import ts from 'typescript'

import { dedent, omitLeadingWhitespace } from '../../__helpers__/dedent-string'
import { workspaceRoot } from '../../__helpers__/workspace-root'
import { TsJestDiagnosticCodes } from '../../utils'
import { normalizeSlashes } from '../../utils/normalize-slashes'

import { tsTranspileModule } from './transpile-module'

jest.mock('fs', () => {
  const fsImpl = jest.requireActual<typeof import('memfs')>('memfs').fs

  return {
    ...fsImpl,
    readFileSync: (path: string) => {
      if (path.includes('.ts-jest-digest')) {
        return 'ee2e176d55f97f10ef48a41f4e4089940db5d10f'
      }

      return fsImpl.readFileSync(path)
    },
  }
})
jest.mock('node:fs', () => {
  const fsImpl = jest.requireActual<typeof import('memfs')>('memfs').fs

  return {
    ...fsImpl,
    readFileSync: (path: string) => {
      if (path.includes('.ts-jest-digest')) {
        return 'ee2e176d55f97f10ef48a41f4e4089940db5d10f'
      }

      return fsImpl.readFileSync(path)
    },
  }
})

describe('transpileModules', () => {
  describe('with modern Node resolution', () => {
    const tsFilePathInEsmModernNode = path.join(workspaceRoot, 'esm-node-modern', 'foo.ts')
    const mtsFilePath = path.join(workspaceRoot, 'foo.mts')
    const tsFilePathInCjsModernNode = path.join(workspaceRoot, 'cjs-node-modern', 'foo.ts')
    const ctsFilePath = path.join(workspaceRoot, 'foo.cts')
    beforeEach(() => {
      vol.reset()
      vol.fromJSON(
        {
          './esm-node-modern/package.json': JSON.stringify({
            name: 'test-package-1',
            type: 'module',
          } as PackageJson),
          './esm-node-modern/foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
          './foo.mts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
          './cjs-node-modern/package.json': JSON.stringify({
            name: 'test-package-1',
            type: 'commonjs',
          } as PackageJson),
          './cjs-node-modern/foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
          './foo.cts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
        },
        workspaceRoot,
      )
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
      },
      {
        module: ts.ModuleKind.Node18,
      },
      {
        module: ts.ModuleKind.Node20,
      },
      {
        module: ts.ModuleKind.NodeNext,
      },
    ])('should emit CJS code with "type: commonjs" in package.json', ({ module }) => {
      const result = tsTranspileModule(vol.readFileSync(tsFilePathInCjsModernNode, 'utf-8').toString(), {
        fileName: tsFilePathInCjsModernNode,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
          verbatimModuleSyntax: true,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        const foo_1 = require("foo");
        console.log(foo_1.foo);
        const loadFooAsync = async () => {
          const fooDefault = await import('foo');
          console.log(fooDefault);
        };
        console.log(loadFooAsync());
      `)
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
      },
      {
        module: ts.ModuleKind.Node18,
      },
      {
        module: ts.ModuleKind.Node20,
      },
      {
        module: ts.ModuleKind.NodeNext,
      },
    ])('should emit ESM code with "type: module" in package.json', ({ module }) => {
      const result = tsTranspileModule(vol.readFileSync(tsFilePathInEsmModernNode, 'utf-8').toString(), {
        fileName: tsFilePathInEsmModernNode,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
        console.log(foo);
        const loadFooAsync = async () => {
          const fooDefault = await import('foo');
          console.log(fooDefault);
        };
        console.log(loadFooAsync());
      `)
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: ts.ModuleKind.ES2020,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: undefined,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
    ])(
      'should always emit ESM code with ".mts" extension regardless module option value',
      ({ module, expectedResult }) => {
        const result = tsTranspileModule(vol.readFileSync(mtsFilePath, 'utf-8').toString(), {
          fileName: mtsFilePath,
          compilerOptions: {
            module,
            target: ts.ScriptTarget.ESNext,
          },
        })

        expect(omitLeadingWhitespace(result.outputText)).toContain(expectedResult)
      },
    )

    it.each([
      {
        module: ts.ModuleKind.Node16,
        expectedResult: dedent`
          const foo_1 = require("foo");
          console.log(foo_1.foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: ts.ModuleKind.ES2020,
        expectedResult: dedent`
          const foo_1 = require("foo");
          console.log(foo_1.foo);
          const loadFooAsync = async () => {
            const fooDefault = await Promise.resolve().then(() => require('foo'));
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: undefined,
        expectedResult: dedent`
          const foo_1 = require("foo");
          console.log(foo_1.foo);
          const loadFooAsync = async () => {
            const fooDefault = await Promise.resolve().then(() => require('foo'));
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
    ])(
      'should always emit CJS code with ".cts" extension regardless module option value',
      ({ module, expectedResult }) => {
        const result = tsTranspileModule(vol.readFileSync(ctsFilePath, 'utf-8').toString(), {
          fileName: ctsFilePath,
          compilerOptions: {
            module,
            target: ts.ScriptTarget.ESNext,
          },
        })

        expect(omitLeadingWhitespace(result.outputText)).toContain(expectedResult)
      },
    )

    it('should use the supplied compiler file system to determine package type', () => {
      const packageJsonPath = normalizeSlashes(path.join(workspaceRoot, 'esm-node-modern', 'package.json'))
      const fileExists = jest.fn((fileName: string) => normalizeSlashes(fileName) === packageJsonPath)
      const readFile = jest.fn((fileName: string) =>
        normalizeSlashes(fileName) === packageJsonPath ? JSON.stringify({ type: 'module' }) : undefined,
      )
      const result = tsTranspileModule(
        'export const value = 1',
        {
          fileName: tsFilePathInEsmModernNode,
          compilerOptions: { module: ts.ModuleKind.NodeNext, target: ts.ScriptTarget.ESNext },
        },
        { ...ts, sys: { ...ts.sys, fileExists, readFile } },
      )

      expect(fileExists.mock.calls.map(([fileName]) => normalizeSlashes(fileName))).toContain(packageJsonPath)
      expect(readFile.mock.calls.map(([fileName]) => normalizeSlashes(fileName))).toContain(packageJsonPath)
      expect(result.outputText).toBe('export const value = 1;\n')
    })
  })

  describe('with classic CommonJS module and ES module kind', () => {
    const filePath = path.join(workspaceRoot, 'bar.ts')

    beforeEach(() => {
      vol.reset()
      vol.fromJSON(
        {
          './bar.ts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
        },
        workspaceRoot,
      )
    })

    it('should emit CJS code with module kind set to CommonJS', () => {
      const result = tsTranspileModule(vol.readFileSync(filePath, 'utf-8').toString(), {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        const foo_1 = require("foo");
        console.log(foo_1.foo);
        const loadFooAsync = async () => {
          const fooDefault = await Promise.resolve().then(() => require('foo'));
          console.log(fooDefault);
        };
        console.log(loadFooAsync());
      `)
    })

    it('should emit ESM code with module kind set to one of ES module value', () => {
      const result = tsTranspileModule(vol.readFileSync(filePath, 'utf-8').toString(), {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ES2022,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
        console.log(foo);
        const loadFooAsync = async () => {
          const fooDefault = await import('foo');
          console.log(fooDefault);
        };
        console.log(loadFooAsync());
      `)
    })
  })

  describe('with compiler options and source metadata', () => {
    beforeEach(() => {
      vol.reset()
    })

    it.each([
      { newLine: ts.NewLineKind.CarriageReturnLineFeed, expectedNewLine: '\r\n' },
      { newLine: ts.NewLineKind.LineFeed, expectedNewLine: '\n' },
    ])('should emit the configured line ending $newLine', ({ newLine, expectedNewLine }) => {
      const result = tsTranspileModule('const value: number = 1; console.log(value)', {
        compilerOptions: { newLine },
      })

      expect(result.outputText).toBe(`var value = 1;${expectedNewLine}console.log(value);${expectedNewLine}`)
    })

    it('should use default compiler options when none are supplied', () => {
      const result = tsTranspileModule('const value: number = 1', {})

      expect(result.outputText).toBe('var value = 1;\n')
      expect(result.diagnostics).toEqual([])
    })

    it('should infer a TSX filename when JSX is enabled', () => {
      const result = tsTranspileModule('export const view = <div />', {
        compilerOptions: { jsx: ts.JsxEmit.React, sourceMap: true },
      })

      expect(result.outputText).toContain('React.createElement("div", null)')
      expect(JSON.parse(result.sourceMapText ?? '')).toMatchObject({
        file: 'module.js',
        sources: ['module.tsx'],
      })
      expect(result.diagnostics).toEqual([])
    })

    it('should apply AMD module names and renamed dependencies to emitted code', () => {
      const result = tsTranspileModule('import { value } from "./dependency"; export const result = value', {
        compilerOptions: { module: ts.ModuleKind.AMD },
        moduleName: 'named-module',
        renamedDependencies: { './dependency': 'renamed-dependency' },
      })

      expect(result.outputText).toContain(
        'define("named-module", ["require", "exports", "renamed-dependency"], function (require, exports, dependency_1)',
      )
      expect(result.outputText).toContain('exports.result = dependency_1.value;')
      expect(result.diagnostics).toEqual([])
    })

    it('should emit JavaScript and its source map when declaration output is requested', () => {
      const result = tsTranspileModule('export const value: number = 1', {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          declaration: true,
          declarationMap: true,
          emitDeclarationOnly: true,
          sourceMap: true,
        },
      })

      expect(result.outputText).toContain('exports.value = 1;')
      expect(result.outputText).toContain('sourceMappingURL=module.js.map')
      expect(JSON.parse(result.sourceMapText ?? '')).toMatchObject({ file: 'module.js', sources: ['module.ts'] })
      expect(result.diagnostics).toEqual([])
    })

    it.each([
      { jsDocParsingMode: undefined, expectedTags: ['deprecated'] },
      { jsDocParsingMode: ts.JSDocParsingMode.ParseAll, expectedTags: ['deprecated'] },
      { jsDocParsingMode: ts.JSDocParsingMode.ParseNone, expectedTags: [] },
    ])('should respect JSDoc parsing mode $jsDocParsingMode in transformers', ({ jsDocParsingMode, expectedTags }) => {
      let tags: string[] = []
      const result = tsTranspileModule('/** @deprecated legacy value */\nexport function value() {}', {
        jsDocParsingMode,
        transformers: () => ({
          before: [
            () => (sourceFile) => {
              tags = ts.getJSDocTags(sourceFile.statements[0]).map((tag) => tag.tagName.text)

              return sourceFile
            },
          ],
        }),
      })

      expect(tags).toEqual(expectedTags)
      expect(result.outputText).toContain('function value() { }')
    })

    it('should execute before and after transformers against the program being emitted', () => {
      const fileName = path.join(workspaceRoot, 'transformed.ts')
      let transformerSource: ts.SourceFile | undefined
      const result = tsTranspileModule('export const value = 1', {
        fileName,
        compilerOptions: { module: ts.ModuleKind.CommonJS, sourceMap: true, inlineSources: true },
        transformers: (program) => ({
          before: [
            (context) => (sourceFile) => {
              transformerSource = program.getSourceFile(fileName)
              const visit: ts.Visitor = (node) =>
                ts.isNumericLiteral(node)
                  ? context.factory.createNumericLiteral(2)
                  : ts.visitEachChild(node, visit, context)

              return ts.visitEachChild(sourceFile, visit, context)
            },
          ],
          after: [
            (context) => (sourceFile) =>
              context.factory.updateSourceFile(sourceFile, [
                ...sourceFile.statements,
                context.factory.createExpressionStatement(context.factory.createStringLiteral('after transform')),
              ]),
          ],
        }),
      })

      expect(transformerSource?.text).toBe('export const value = 1')
      expect(result.outputText).toContain('exports.value = 2;')
      expect(result.outputText).toContain('"after transform";')
      expect(JSON.parse(result.sourceMapText ?? '')).toMatchObject({
        sources: ['transformed.ts'],
        sourcesContent: ['export const value = 1'],
      })
    })

    it('should support configured compilers requesting default libraries and missing auxiliary sources', () => {
      let formattedDiagnostics = ''
      let compilerProgram: ts.Program | undefined
      const compilerModule = {
        ...ts,
        createProgram: (
          rootNamesOrOptions: readonly string[] | ts.CreateProgramOptions,
          options?: ts.CompilerOptions,
          host?: ts.CompilerHost,
          oldProgram?: ts.Program,
          configFileParsingDiagnostics?: readonly ts.Diagnostic[],
        ) => {
          const programOptions =
            'rootNames' in rootNamesOrOptions
              ? rootNamesOrOptions
              : {
                  rootNames: rootNamesOrOptions,
                  options: options ?? {},
                  host,
                  oldProgram,
                  configFileParsingDiagnostics,
                }
          const compilerHost = programOptions.host
          if (!compilerHost) {
            throw new Error('CompilerHost is required')
          }
          compilerProgram = ts.createProgram({
            ...programOptions,
            rootNames: [
              ...programOptions.rootNames,
              compilerHost.getDefaultLibFileName(programOptions.options),
              'missing.ts',
            ],
          })
          formattedDiagnostics = ts.formatDiagnostics(compilerProgram.getOptionsDiagnostics(), compilerHost)

          return compilerProgram
        },
      }
      const result = tsTranspileModule(
        'const values: number[] = [1]; console.log(values.length)',
        { compilerOptions: { newLine: ts.NewLineKind.CarriageReturnLineFeed } },
        compilerModule,
      )

      expect(compilerProgram?.getSourceFile('lib.d.ts')?.text).toContain('interface Array<T>')
      expect(compilerProgram?.getSourceFile('missing.ts')).toBeUndefined()
      expect(result.diagnostics?.map(({ code }) => code)).toContain(6053)
      expect(formattedDiagnostics).toContain("error TS6053: File 'missing.ts' not found.\r\n")
      expect(result.outputText).toBe('var values = [1];\r\nconsole.log(values.length);\r\n')
    })
  })

  describe('with diagnostics', () => {
    const testFilePath = path.join(workspaceRoot, 'foo.ts')
    beforeEach(() => {
      vol.reset()
      vol.fromJSON(
        {
          './foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
        `,
        },
        workspaceRoot,
      )
    })

    it('should return diagnostics for invalid combination of compiler options', () => {
      const result = tsTranspileModule(vol.readFileSync(testFilePath, 'utf-8').toString(), {
        fileName: testFilePath,
        compilerOptions: {
          module: ts.ModuleKind.Node16,
          moduleResolution: ts.ModuleResolutionKind.Classic,
        },
      })

      expect(result.diagnostics?.[0].messageText).toBeTruthy()
    })

    it.each([true, false])('should include syntactic diagnostics only when requested: %s', (reportDiagnostics) => {
      const result = tsTranspileModule('const = 1', {
        fileName: testFilePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
        },
        reportDiagnostics,
      })

      expect(Boolean(result.diagnostics?.length)).toBe(reportDiagnostics)
    })

    it('should preserve source maps and provide its Program to custom transformers', () => {
      let transformerProgram: ts.Program | undefined
      const result = tsTranspileModule('export const value = 1', {
        fileName: testFilePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          sourceMap: true,
        },
        transformers: (program) => {
          transformerProgram = program

          return {}
        },
      })

      expect(transformerProgram).toBeDefined()
      expect(result.sourceMapText).toContain('"version":3')
      expect(result.outputText).toContain('sourceMappingURL=foo.js.map')
    })

    it('should use the supplied TypeScript compiler module', () => {
      const compilerModule = { ...ts }
      const createProgram = jest.spyOn(compilerModule, 'createProgram')

      tsTranspileModule(
        'export const value = 1',
        {
          fileName: testFilePath,
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        },
        compilerModule,
      )

      expect(createProgram).toHaveBeenCalledTimes(1)
    })

    it('should return an error diagnostic when a declaration file produces no JavaScript', () => {
      const fileName = path.join(workspaceRoot, 'types.d.ts')
      const result = tsTranspileModule('declare const value: number', { fileName })

      expect(result.outputText).toBe('')
      expect(result.sourceMapText).toBeUndefined()
      expect(result.diagnostics).toEqual([
        expect.objectContaining({
          category: ts.DiagnosticCategory.Error,
          code: TsJestDiagnosticCodes.Generic,
          messageText: 'No output generated',
          file: expect.objectContaining({ fileName: normalizeSlashes(fileName) }),
          start: 0,
          length: 0,
        }),
      ])
    })

    it('should preserve emit diagnostics when a configured compiler cannot emit', () => {
      const diagnostic: ts.Diagnostic = {
        category: ts.DiagnosticCategory.Error,
        code: 5033,
        messageText: "Could not write file 'foo.js': output unavailable.",
        file: undefined,
        start: undefined,
        length: undefined,
      }
      const compilerModule = {
        ...ts,
        createProgram: (
          rootNamesOrOptions: readonly string[] | ts.CreateProgramOptions,
          options?: ts.CompilerOptions,
          host?: ts.CompilerHost,
          oldProgram?: ts.Program,
          configFileParsingDiagnostics?: readonly ts.Diagnostic[],
        ) => {
          const programOptions =
            'rootNames' in rootNamesOrOptions
              ? rootNamesOrOptions
              : {
                  rootNames: rootNamesOrOptions,
                  options: options ?? {},
                  host,
                  oldProgram,
                  configFileParsingDiagnostics,
                }

          return {
            ...ts.createProgram(programOptions),
            emit: () => ({ emitSkipped: true, diagnostics: [diagnostic] }),
          }
        },
      }
      const result = tsTranspileModule(
        'export const value = 1',
        { fileName: testFilePath, compilerOptions: { module: ts.ModuleKind.CommonJS } },
        compilerModule,
      )

      expect(result.outputText).toBe('')
      expect(result.diagnostics).toEqual([
        diagnostic,
        expect.objectContaining({ code: TsJestDiagnosticCodes.Generic, messageText: 'No output generated' }),
      ])
    })
  })
})
