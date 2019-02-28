// tslint:disable:max-line-length

/**
 * @internal
 */
export enum Errors {
  LoadingModuleFailed = 'Loading module {{module}} failed with error: {{error}}',
  UnableToLoadOneModule = 'Unable to load the module {{module}}. {{reason}} To fix it:\n{{fix}}',
  UnableToLoadAnyModule = 'Unable to load any of these modules: {{module}}. {{reason}}. To fix it:\n{{fix}}',
  TypesUnavailableWithoutTypeCheck = 'Type information is unavailable with "isolatedModules"',
  UnableToRequireDefinitionFile = 'Unable to require `.d.ts` file.\nThis is usually the result of a faulty configuration or import. Make sure there is a `.js`, `.json` or another executable extension available alongside `{{file}}`.',
  FileNotFound = 'File not found: {{inputPath}} (resolved as: {{resolvedPath}})',
  UntestedDependencyVersion = "Version {{actualVersion}} of {{module}} installed has not been tested with ts-jest. If you're experiencing issues, consider using a supported version ({{expectedVersion}}). Please do not report issues in ts-jest if you are using unsupported versions.",
  MissingDependency = "Module {{module}} is not installed. If you're experiencing issues, consider installing a supported version ({{expectedVersion}}).",
  UnableToCompileTypeScript = 'TypeScript diagnostics ({{help}}):\n{{diagnostics}}',
  NotMappingMultiStarPath = 'Not mapping "{{path}}" because it has more than one star (`*`).',
  NotMappingPathWithEmptyMap = 'Not mapping "{{path}}" because it has no target.',
  MappingOnlyFirstTargetOfPath = 'Mapping only to first target of "{{path}}" because it has more than one ({{count}}).',
  GotJsFileButAllowJsFalse = 'Got a `.js` file to compile while `allowJs` option is not set to `true` (file: {{path}}). To fix this:\n  - if you want TypeScript to process JS files, set `allowJs` to `true` in your TypeScript config (usually tsconfig.json)\n  - if you do not want TypeScript to process your `.js` files, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match `.js` files anymore',
  GotUnknownFileTypeWithoutBabel = 'Got a unknown file type to compile (file: {{path}}). To fix this, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match this kind of files anymore.',
  GotUnknownFileTypeWithBabel = 'Got a unknown file type to compile (file: {{path}}). To fix this, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match this kind of files anymore. If you still want Babel to process it, add another entry to the `transform` option with value `babel-jest` which key matches this type of files.',
  ConfigNoModuleInterop = 'If you have issues related to imports, you should consider setting `esModuleInterop` to `true` in your TypeScript configuration file (usually `tsconfig.json`). See https://blogs.msdn.microsoft.com/typescript/2018/01/31/announcing-typescript-2-7/#easier-ecmascript-module-interoperability for more information.',
  UnableToFindProjectRoot = 'Unable to find the root of the project where ts-jest has been installed.',
  UnableToResolveJestConfig = 'Unable to resolve jest-config. Ensure Jest is properly installed.',
}

/**
 * @internal
 */
export enum Helps {
  FixMissingModule = '{{label}}: `npm i -D {{module}}` (or `yarn add --dev {{module}}`)',
  IgnoreDiagnosticCode = 'customize using `[jest-config].globals.ts-jest.diagnostics` option',
  MigrateConfigUsingCLI = 'Your Jest configuration is outdated. Use the CLI to help migrating it: ts-jest config:migrate <config-file>.',
}

/**
 * @internal
 */
export enum Deprecateds {
  EnvVar = 'Using env. var "{{old}}" is deprecated, use "{{new}}" instead.',
  ConfigOption = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.',
  ConfigOptionWithNote = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.\n    ↳ {{note}}',
  ConfigOptionUseBabelRcNote = 'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
  HelperMovedToUtils = "The `{{helper}}` helper has been moved to `ts-jest/utils`. Use `import { {{helper}} } from 'ts-jest/utils'` instead.",
}

/**
 * @internal
 */
export enum ImportReasons {
  TsJest = 'Using "ts-jest" requires this package to be installed.',
  BabelJest = 'Using "babel-jest" requires this package to be installed.',
}

/**
 * @internal
 */
export function interpolate(msg: string, vars: Record<string, any> = {}): string {
  return msg.replace(/\{\{([^\}]+)\}\}/g, (_, key) => (key in vars ? vars[key] : _))
}
