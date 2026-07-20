import { TsJestDiagnosticCodes } from './diagnostics'

/**
 * @internal
 */
export const enum Errors {
  LoadingModuleFailed = 'Loading module {{module}} failed with error: {{error}}',
  UnableToLoadOneModule = 'Unable to load the module {{module}}. {{reason}} To fix it:\n{{fix}}',
  UnableToLoadAnyModule = 'Unable to load any of these modules: {{module}}. {{reason}}. To fix it:\n{{fix}}',
  UnableToRequireDefinitionFile = 'Unable to require `.d.ts` file for file: {{file}}.\nThis is usually the result of a faulty configuration or import. Make sure there is a `.js`, `.json` or another executable extension available alongside `{{file}}`.',
  FileNotFound = 'File not found: {{inputPath}} (resolved as: {{resolvedPath}})',
  UnableToCompileTypeScript = '{{diagnostics}}',
  NotMappingMultiStarPath = 'Not mapping "{{path}}" because it has more than one star (`*`).',
  NotMappingPathWithEmptyMap = 'Not mapping "{{path}}" because it has no target.',
  GotJsFileButAllowJsFalse = 'Got a `.js` file to compile while `allowJs` option is not set to `true` (file: {{path}}). To fix this:\n  - if you want TypeScript to process JS files, set `allowJs` to `true` in your TypeScript config (usually tsconfig.json)\n  - if you do not want TypeScript to process your `.js` files, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match `.js` files anymore',
  GotUnknownFileTypeWithoutBabel = 'Got a unknown file type to compile (file: {{path}}). To fix this, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match this kind of files anymore.',
  GotUnknownFileTypeWithBabel = 'Got a unknown file type to compile (file: {{path}}). To fix this, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match this kind of files anymore. If you still want Babel to process it, add another entry to the `transform` option with value `babel-jest` which key matches this type of files.',
  ConfigNoModuleInterop = 'If you have issues related to imports, you should consider setting `esModuleInterop` to `true` in your TypeScript configuration file (usually `tsconfig.json`). See https://blogs.msdn.microsoft.com/typescript/2018/01/31/announcing-typescript-2-7/#easier-ecmascript-module-interoperability for more information.',
  MismatchNodeTargetMapping = 'There is a mismatch between your NodeJs version {{nodeJsVer}} and your TypeScript target {{compilationTarget}}. This might lead to some unexpected errors when running tests with `ts-jest`. To fix this, you can check https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping',
  CannotProcessFileReturnOriginal = "Unable to process '{{file}}', falling back to original file content. You can also configure Jest config option `transformIgnorePatterns` to ignore {{file}} from transformation or make sure that `outDir` in your tsconfig is neither `''` or `'.'`",
  CannotProcessFile = "Unable to process '{{file}}', please make sure that `outDir` in your tsconfig is neither `''` or `'.'`. You can also configure Jest config option `transformIgnorePatterns` to inform `ts-jest` to transform {{file}}",
  MissingTransformerName = 'The AST transformer {{file}} must have an `export const name = <your_transformer_name>`',
  MissingTransformerVersion = 'The AST transformer {{file}} must have an `export const version = <your_transformer_version>`',
  InvalidModuleKindForEsm = 'The current compiler option "module" value is not suitable for Jest ESM mode. Please either use ES module kinds or Node16/NodeNext module kinds with "type: module" in package.json',
  CompilerModuleWithoutJsApi = 'The `compiler` module "{{module}}" (version {{version}}) does not expose the TypeScript JS compiler API (`transpileModule`/`createLanguageService`) that ts-jest uses for emit and AST transforms. If this is native TypeScript 7+, install the official compatibility package alongside it:\n    ↳ `npm i -D @typescript/typescript6` (or `yarn add --dev @typescript/typescript6`)\nand either remove the `compiler` option (ts-jest will detect it automatically) or set `compiler: "@typescript/typescript6"`.',
  NativeTypeScriptWithoutCompatPackage = 'Your project\'s `typescript` package (version {{version}}) is the native TypeScript compiler, which does not ship the JS compiler API that ts-jest uses for emit and AST transforms. Install the official compatibility package next to it:\n    ↳ `npm i -D @typescript/typescript6` (or `yarn add --dev @typescript/typescript6`)\nIt is designed to coexist with native TypeScript, and ts-jest will pick it up automatically. Type-checking can still use the fast native compiler via the ts-jest option `diagnostics: { engine: "native" }`.',
}

/**
 * @internal
 */
export const Helps = {
  FixMissingModule: '{{label}}: `npm i -D {{module}}` (or `yarn add --dev {{module}}`)',
  UsingTypescript6CompatPackage:
    'Your project\'s `typescript` package (version {{version}}) is the native TypeScript compiler without a JS compiler API; ts-jest is using "@typescript/typescript6" (version {{compatVersion}}) for emit and AST transforms instead.',
  NativeCheckerUnavailable:
    'The ts-jest option `diagnostics.engine` was set to "native" but the native TypeScript API could not be loaded ({{reason}}). Falling back to `diagnostics.engine: "compiler"`. The native engine requires the `typescript` package to be native TypeScript 7 or later, running on a Node.js version that supports `require()` of ES modules (>=20.19 or >=22.12).',
  NativeCheckerIgnoredIsolatedModules:
    'The ts-jest option `diagnostics.engine: "native"` has no effect because `isolatedModules` is enabled and type-checking is skipped entirely.',
  InvalidDiagnosticsEngine:
    'Invalid value for the ts-jest option `diagnostics.engine`: {{value}}. Expected "compiler" or "native". Using "compiler".',
  MigrateConfigUsingCLI:
    'Your Jest configuration is outdated. Use the CLI to help migrating it: ts-jest config:migrate <config-file>.',
  UsingModernNodeResolution: `Using hybrid module kind (Node16/18/Next) is only supported in "isolatedModules: true". Please set "isolatedModules: true" in your tsconfig.json. To disable this message, you can set "diagnostics.ignoreCodes" to include ${TsJestDiagnosticCodes.ModernNodeModule} in your ts-jest config. See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/options/diagnostics`,
} as const

/**
 * @internal
 */
export const enum Deprecations {
  EnvVar = 'Using env. var "{{old}}" is deprecated, use "{{new}}" instead.',
  ConfigOption = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.',
  ConfigOptionWithNote = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.\n    ↳ {{note}}',
  ConfigOptionUseBabelRcNote = 'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  GlobalsTsJestConfigOption = 'Define `ts-jest` config under `globals` is deprecated. Please do\n' +
    'transform: {\n' +
    "    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],\n" +
    '},\n' +
    'See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced',
  IsolatedModulesWithTsconfigPath = `
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in {{tsconfigFilePath}} instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  `,
  IsolatedModulesWithoutTsconfigPath = `
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true", see https://www.typescriptlang.org/tsconfig/#isolatedModules
  `,
}

/**
 * @internal
 */
export const enum ImportReasons {
  TsJest = 'Using "ts-jest" requires this package to be installed.',
  BabelJest = 'Using "babel-jest" requires this package to be installed.',
  EsBuild = 'Using "esbuild" requires this package to be installed.',
}

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function interpolate(msg: string, vars: Record<string, any> = {}): string {
  // eslint-disable-next-line no-useless-escape
  return msg.replace(/\{\{([^\}]+)\}\}/g, (_, key) => (key in vars ? vars[key] : _))
}
