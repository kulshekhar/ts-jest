// tslint:disable:max-line-length
export enum Errors {
  UnableToLoadOneModule = 'Unable to load the module {{module}}. {{reason}} To fix it:\n{{fix}}',
  UnableToLoadAnyModule = 'Unable to load any of these modules: {{module}}. {{reason}}. To fix it:\n{{fix}}',
  TypesUnavailableWithoutTypeCheck = 'Type information is unavailable without "typeCheck"',
  UnableToRequireDefinitionFile = 'Unable to require `.d.ts` file.\nThis is usually the result of a faulty configuration or import. Make sure there is a `.js`, `.json` or another executable extension available alongside `{{file}}`.',
  FileNotFound = 'File not found: {{inputPath}} (resolved as: {{resolvedPath}})',
  UntestedDependencyVersion = "Version {{actualVersion}} of {{module}} installed has not been tested with ts-jest. If you're experiencing issues, consider using a supported version ({{expectedVersion}}). Please do not report issues in ts-jest if you are using unsupported versions.",
  MissingDependency = "Module {{module}} is not installed. If you're experiencing issues, consider installing a supported version ({{expectedVersion}}).",
}

export enum Helps {
  FixMissingModule = '{{label}}: `npm i -D {{module}}` (or `yarn add --dev {{module}}`)',
  IgnoreDiagnosticCode = 'add any of the code(s) to `globals.ts-jest.diagnostics.ignoreCodes` array in Jest configuration will silent this',
}

export enum Deprecateds {
  ConfigOption = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.',
  ConfigOptionWithNote = '"[jest-config].{{oldPath}}" is deprecated, use "[jest-config].{{newPath}}" instead.\n    ↳ {{note}}',
  ConfigOptionUseBabelRcNote = 'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
}

export enum ImportReasons {
  TsJest = 'Using "ts-jest" requires this package to be installed.',
  BabelJest = 'Using "babel-jest" requires this package to be installed.',
}

export function interpolate(
  msg: string,
  vars: Record<string, any> = {},
): string {
  return msg.replace(
    /\{\{([^\}]+)\}\}/g,
    (_, key) => (key in vars ? vars[key] : _),
  )
}
