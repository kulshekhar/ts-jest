// tslint:disable:max-line-length
export enum Errors {
  InvalidStringifyContentPathRegex = 'Option "stringifyContentPathRegex" should be a valid regex pattern.',
  UnableToFindPackageJson = 'Unable to find package.json from "{{fromPath}}".',
  InvalidDiagnosticsOption = 'Invalid value for diagnostics: {{value}}.',
  UnableToLoadOneModule = 'Unable to load the module {{module}}. {{reason}} To fix it:\n{{fix}}',
  UnableToLoadAnyModule = 'Unable to load any of these modules: {{module}}. {{reason}}. To fix it:\n{{fix}}',
  UnableToFindTsConfig = 'Could not find a TS config file (given: "{{given}}", root: "{{root}}").',
  TypesUnavailableWithoutTypeCheck = 'Type information is unavailable without "typeCheck"',
  UnableToRequireDefinitionFile = 'Unable to require `.d.ts` file.\nThis is usually the result of a faulty configuration or import. Make sure there is a `.js`, `.json` or another executable extension available alongside `{{file}}`.',
  FileNotFound = 'File not found: {{inputPath}} (resolved as: {{resolvedPath}})',
}

export enum Helps {
  FixMissingModule = '{{label}}: `npm i -D {{module}}` (or `yarn add --dev {{module}}`)',
}

export enum Deprecateds {
  ConfigOption = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.',
  ConfigOptionWithNote = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.\n    ↳ {{note}}',
  ConfigOptionUseBabelRcNote = 'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
}

export enum ImportReasons {
  tsJest = 'Using "ts-jest" requires this package to be installed.',
  babelJest = 'Using "babel-jest" requires this package to be installed.',
  babelConfigLookup = 'Using "babel-jest" with config lookup relies on this package to be installed.',
}

export function interpolate(
  msg: string,
  vars: Record<string, any> = {},
): string {
  return msg.replace(/\{\{([^\}]+)\}\}/g, (_, key) => vars[key])
}
