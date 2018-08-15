// tslint:disable:max-line-length
export enum Errors {
  InvalidStringifyContentPathRegex = '[ts-jest] Option "stringifyContentPathRegex" should be a valid regex pattern.',
  UnableToFindPackageJson = '[ts-jest] Unable to find package.json from "{{fromPath}}".',
  InvalidDiagnosticsOption = '[ts-jest] Invalid value for diagnostics: {{value}}.',
  UnableToLoadOneModule = '[ts-jest] Unable to load the module {{module}}. {{reason}} To fix it:\n{{fix}}',
  UnableToLoadAnyModule = '[ts-jest] Unable to load any of these modules: {{module}}. {{reason}}. To fix it:\n{{fix}}',
  UnableToFindTsConfig = '[ts-jest] Could not find a TS config file (given: "{{given}}", root: "{{root}}").',
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
