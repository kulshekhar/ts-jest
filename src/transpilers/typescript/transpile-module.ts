import path from 'node:path'

import ts from 'typescript'

import type { TTypeScript } from '../../types'
import { TsJestDiagnosticCodes } from '../../utils'

const barebonesLibContent = `/// <reference no-default-lib="true"/>
interface Boolean {}
interface Function {}
interface CallableFunction {}
interface NewableFunction {}
interface IArguments {}
interface Number {}
interface Object {}
interface RegExp {}
interface String {}
interface Array<T> { length: number; [n: number]: T; }
interface SymbolConstructor {
    (desc?: string | number): symbol;
    for(name: string): symbol;
    readonly toStringTag: symbol;
}
declare var Symbol: SymbolConstructor;
interface Symbol {
    readonly [Symbol.toStringTag]: string;
}`
const barebonesLibName = 'lib.d.ts'
const barebonesLibSourceFiles = new WeakMap<object, ts.SourceFile>()

const carriageReturnLineFeed = '\r\n'
const lineFeed = '\n'
function getNewLineCharacter(options: ts.CompilerOptions, compilerModule: TTypeScript): string {
  switch (options.newLine) {
    case compilerModule.NewLineKind.CarriageReturnLineFeed:
      return carriageReturnLineFeed
    case compilerModule.NewLineKind.LineFeed:
    default:
      return lineFeed
  }
}

type ExtendedTranspileOptions = Omit<ts.TranspileOptions, 'transformers'> & {
  transformers?: (program: ts.Program) => ts.CustomTransformers
}

type ExtendedTsTranspileModuleFn = (
  fileContent: string,
  transpileOptions: ExtendedTranspileOptions,
  compilerModule: TTypeScript,
) => ts.TranspileOutput

export const isModernNodeModuleKind = (module: ts.ModuleKind | undefined, compilerModule: TTypeScript): boolean => {
  const moduleKinds = compilerModule.ModuleKind as typeof compilerModule.ModuleKind & {
    Node18?: ts.ModuleKind
    Node20?: ts.ModuleKind
  }
  // Node18/Node20 are absent from the TypeScript 5.4 declarations but have
  // stable enum values in newer runtimes.

  return module
    ? [
        compilerModule.ModuleKind.Node16,
        moduleKinds.Node18 ?? 101,
        moduleKinds.Node20 ?? 102,
        compilerModule.ModuleKind.NodeNext,
      ].includes(module)
    : false
}

const shouldCheckProjectPkgJsonContent = (
  fileName: string,
  moduleKind: ts.ModuleKind | undefined,
  compilerModule: TTypeScript,
): boolean => {
  return fileName.endsWith('package.json') && isModernNodeModuleKind(moduleKind, compilerModule)
}

/**
 * Copy source code of {@link ts.transpileModule} from {@link https://github.com/microsoft/TypeScript/blob/main/src/services/transpile.ts}
 * with extra modifications:
 * - Remove generation of declaration files
 * - Allow using custom AST transformers with the internal created {@link Program}
 */
const transpileWorker: ExtendedTsTranspileModuleFn = (input, transpileOptions, compilerModule) => {
  let barebonesLibSourceFile = barebonesLibSourceFiles.get(compilerModule)
  if (!barebonesLibSourceFile) {
    barebonesLibSourceFile = compilerModule.createSourceFile(barebonesLibName, barebonesLibContent, {
      languageVersion: compilerModule.ScriptTarget.Latest,
    })
    barebonesLibSourceFiles.set(compilerModule, barebonesLibSourceFile)
  }

  const diagnostics: ts.Diagnostic[] = []

  const options: ts.CompilerOptions = transpileOptions.compilerOptions
    ? // @ts-expect-error internal TypeScript API
      compilerModule.fixupCompilerOptions(transpileOptions.compilerOptions, diagnostics)
    : {}

  // mix in default options
  const defaultOptions = compilerModule.getDefaultCompilerOptions()
  for (const key in defaultOptions) {
    if (Object.hasOwn(defaultOptions, key) && options[key] === undefined) {
      options[key] = defaultOptions[key]
    }
  }

  // @ts-expect-error internal TypeScript API
  for (const option of compilerModule.transpileOptionValueCompilerOptions) {
    // Do not set redundant config options if `verbatimModuleSyntax` was supplied.
    if (options.verbatimModuleSyntax && new Set(['isolatedModules']).has(option.name)) {
      continue
    }

    options[option.name] = option.transpileOptionValue
  }

  // transpileModule does not write anything to disk so there is no need to verify that there are no conflicts between input and output paths.
  options.suppressOutputPathCheck = true

  // Filename can be non-ts file.
  options.allowNonTsExtensions = true
  options.declaration = false
  options.declarationMap = false

  const newLine = getNewLineCharacter(options, compilerModule)
  // if jsx is specified then treat file as .tsx
  const inputFileName =
    transpileOptions.fileName ?? (transpileOptions.compilerOptions?.jsx ? 'module.tsx' : 'module.ts')
  // Create a compilerHost object to allow the compiler to read and write files
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => {
      // @ts-expect-error internal TypeScript API
      if (fileName === compilerModule.normalizePath(inputFileName)) {
        return sourceFile
      }

      // @ts-expect-error internal TypeScript API
      return fileName === compilerModule.normalizePath(barebonesLibName) ? barebonesLibSourceFile : undefined
    },
    writeFile: (name, text) => {
      if (path.extname(name) === '.map') {
        sourceMapText = text
      } else {
        outputText = text
      }
    },
    getDefaultLibFileName: () => barebonesLibName,
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '',
    getNewLine: () => newLine,
    fileExists: (fileName) => {
      if (shouldCheckProjectPkgJsonContent(fileName, options.module, compilerModule)) {
        return compilerModule.sys.fileExists(fileName)
      }

      return fileName === inputFileName
    },
    readFile: (fileName) => {
      if (shouldCheckProjectPkgJsonContent(fileName, options.module, compilerModule)) {
        return compilerModule.sys.readFile(fileName)
      }

      return ''
    },
    directoryExists: () => true,
    getDirectories: () => [],
  }

  const sourceFile = compilerModule.createSourceFile(inputFileName, input, {
    languageVersion: options.target ?? compilerModule.ScriptTarget.ESNext,
    impliedNodeFormat: compilerModule.getImpliedNodeFormatForFile(
      inputFileName,
      /*packageJsonInfoCache*/ undefined,
      compilerHost,
      options,
    ),
    // @ts-expect-error internal TypeScript API
    setExternalModuleIndicator: compilerModule.getSetExternalModuleIndicator(options),
    jsDocParsingMode: transpileOptions.jsDocParsingMode ?? compilerModule.JSDocParsingMode.ParseAll,
  })
  if (transpileOptions.moduleName) {
    sourceFile.moduleName = transpileOptions.moduleName
  }

  if (transpileOptions.renamedDependencies) {
    // @ts-expect-error internal TypeScript API
    sourceFile.renamedDependencies = new Map(Object.entries(transpileOptions.renamedDependencies))
  }

  // Output
  let outputText: string | undefined
  let sourceMapText: string | undefined
  const inputs = [inputFileName]
  const program = compilerModule.createProgram(inputs, options, compilerHost)

  if (transpileOptions.reportDiagnostics) {
    diagnostics.push(...program.getSyntacticDiagnostics(sourceFile))
  }

  diagnostics.push(...program.getOptionsDiagnostics())

  // Emit
  const result = program.emit(
    /*targetSourceFile*/ undefined,
    /*writeFile*/ undefined,
    /*cancellationToken*/ undefined,
    /*emitOnlyDtsFiles*/ undefined,
    transpileOptions.transformers?.(program),
  )

  diagnostics.push(...result.diagnostics)

  if (outputText === undefined) {
    diagnostics.push({
      category: compilerModule.DiagnosticCategory.Error,
      code: TsJestDiagnosticCodes.Generic,
      messageText: 'No output generated',
      file: sourceFile,
      start: 0,
      length: 0,
    })
  }

  return { outputText: outputText ?? '', diagnostics, sourceMapText }
}

export const tsTranspileModule = (input: string, transpileOptions: ExtendedTranspileOptions, compilerModule = ts) =>
  transpileWorker(input, transpileOptions, compilerModule)
