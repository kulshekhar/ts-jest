// tslint:disable:max-line-length
export enum Errors {
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
  CannotPatchBabelCore6 = 'Error while trying to patch babel-core/lib/transformation/file: {{error}}',
  GotJsFileButAllowJsFalse = 'Got a `.js` file to compile while `allowJs` option is not set to `true` (file: {{path}}). To fix this:\n  - if you want TypeScript to process JS files, set `allowJs` to `true` in your TypeScript config (usually tsconfig.json)\n  - if you do not want TypeScript to process your `.js` files, in your Jest config change the `transform` key which value is `ts-jest` so that it does not match `.js` files anymore',
}

export enum Helps {
  FixMissingModule = '{{label}}: `npm i -D {{module}}` (or `yarn add --dev {{module}}`)',
  IgnoreDiagnosticCode = 'customize using `[jest-config].globals.ts-jest.diagnostics` option',
  MigrateConfigUsingCLI = 'Your Jest configuration is outdated. Use the CLI to help migrating it: ts-jest config:migrate <config-file>.',
}

export enum Deprecateds {
  EnvVar = 'Using env. var "{{old}}" is deprecated, use "{{new}}" instead.',
  ConfigOption = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.',
  ConfigOptionWithNote = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.\n    ↳ {{note}}',
  ConfigOptionUseBabelRcNote = 'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
}

export enum ImportReasons {
  TsJest = 'Using "ts-jest" requires this package to be installed.',
  BabelJest = 'Using "babel-jest" requires this package to be installed.',
}

export function interpolate(msg: string, vars: Record<string, any> = {}): string {
  return msg.replace(/\{\{([^\}]+)\}\}/g, (_, key) => (key in vars ? vars[key] : _))
}
