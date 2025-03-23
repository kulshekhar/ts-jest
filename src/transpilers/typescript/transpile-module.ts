import path from 'node:path'

import ts from 'typescript'

import { TsJestDiagnosticCodes } from '../../utils/messages'

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
let barebonesLibSourceFile: ts.SourceFile | undefined

const carriageReturnLineFeed = '\r\n'
const lineFeed = '\n'
function getNewLineCharacter(options: ts.CompilerOptions): string {
  switch (options.newLine) {
    case ts.NewLineKind.CarriageReturnLineFeed:
      return carriageReturnLineFeed
    case ts.NewLineKind.LineFeed:
    default:
      return lineFeed
  }
}

type ExtendedTsTranspileModuleFn = (input: string, transpileOptions: ts.TranspileOptions) => ts.TranspileOutput

/**
 * Copy source code of {@link ts.transpileModule} from {@link https://github.com/microsoft/TypeScript/blob/main/src/services/transpile.ts}
 * with extra modifications:
 * - Remove generation of declaration files
 * - Allow using custom AST transformers with the internal created {@link Program}
 */
const transpileWorker: ExtendedTsTranspileModuleFn = (input, transpileOptions) => {
  barebonesLibSourceFile ??= ts.createSourceFile(barebonesLibName, barebonesLibContent, {
    languageVersion: ts.ScriptTarget.Latest,
  })

  const diagnostics: ts.Diagnostic[] = []

  const options: ts.CompilerOptions = transpileOptions.compilerOptions
    ? // @ts-expect-error internal TypeScript API
      ts.fixupCompilerOptions(transpileOptions.compilerOptions, diagnostics)
    : {}

  // mix in default options
  const defaultOptions = ts.getDefaultCompilerOptions()
  for (const key in defaultOptions) {
    if (Object.hasOwn(defaultOptions, key) && options[key] === undefined) {
      options[key] = defaultOptions[key]
    }
  }

  // @ts-expect-error internal TypeScript API
  for (const option of ts.transpileOptionValueCompilerOptions) {
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

  const newLine = getNewLineCharacter(options)
  // if jsx is specified then treat file as .tsx
  const inputFileName =
    transpileOptions.fileName ?? (transpileOptions.compilerOptions?.jsx ? 'module.tsx' : 'module.ts')
  // Create a compilerHost object to allow the compiler to read and write files
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName) => {
      // @ts-expect-error internal TypeScript API
      if (fileName === ts.normalizePath(inputFileName)) {
        return sourceFile
      }

      // @ts-expect-error internal TypeScript API
      return fileName === ts.normalizePath(barebonesLibName) ? barebonesLibSourceFile : undefined
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
      return fileName.endsWith('package.json') ? ts.sys.fileExists(fileName) : fileName === inputFileName
    },
    readFile: (fileName) => {
      return fileName.endsWith('package.json') ? ts.sys.readFile(fileName) : ''
    },
    directoryExists: () => true,
    getDirectories: () => [],
  }

  const sourceFile = ts.createSourceFile(inputFileName, input, {
    languageVersion: options.target ?? ts.ScriptTarget.ESNext,
    impliedNodeFormat: ts.getImpliedNodeFormatForFile(
      inputFileName,
      /*packageJsonInfoCache*/ undefined,
      compilerHost,
      options,
    ),
    // @ts-expect-error internal TypeScript API
    setExternalModuleIndicator: ts.getSetExternalModuleIndicator(options),
    jsDocParsingMode: transpileOptions.jsDocParsingMode ?? ts.JSDocParsingMode.ParseAll,
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
  const program = ts.createProgram(inputs, options, compilerHost)

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
    transpileOptions.transformers,
  )

  diagnostics.push(...result.diagnostics)

  if (outputText === undefined) {
    diagnostics.push({
      category: ts.DiagnosticCategory.Error,
      code: TsJestDiagnosticCodes.Generic,
      messageText: 'No output generated',
      file: sourceFile,
      start: 0,
      length: 0,
    })
  }

  return { outputText: outputText ?? '', diagnostics, sourceMapText }
}

export const tsTranspileModule = transpileWorker
