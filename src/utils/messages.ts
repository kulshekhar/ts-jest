// tslint:disable:max-line-length
export enum Errors {
  InvalidStringifyContentPathRegex = '[ts-jest] Option "stringifyContentPathRegex" should be a valid regex pattern.',
  UnableToFindPackageJson = '[ts-jest] Unable to find package.json from "{{fromPath}}".',
  InvalidDiagnosticsOption = '[ts-jest] Invalid value for diagnostics: {{value}}.',
  UnableToLoadOneModule = '[ts-jest] Unable to load the module {{loadModule}}.\n  {{loadReason}}\n    ↳ you can fix this by running: npm i -D {{insallModule}}',
  UnableToLoadAnyModule = '[ts-jest] Unable to load any of these modules: {{loadModule}}\n  {{loadReason}}\n    ↳ you can fix this by running: npm i -D {{insallModule}}',
  UnableToFindTsConfig = '[ts-jest] Could not find a TS config file (given: "{{given}}", root: "{{root}}").',
}

export enum Deprecateds {
  ConfigOption = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.',
  ConfigOptionWithNote = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.\n    ↳ {{note}}',
  ConfigOptionUseBabelRcNote = 'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
}

export enum ImportReasons {
  babelJest = 'Using "babel-jest" requires this package to be installed.',
  babelConfigLookup = 'Using "babel-jest" with config lookup relies on this package to be installed.',
}

export function interpolate(
  msg: string,
  vars: Record<string, any> = {},
): string {
  return msg.replace(/\{\{([^\}]+)\}\}/g, (_, key) => vars[key]);
}
