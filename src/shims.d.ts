declare module 'fast-json-stable-stringify' {
  const fastJsonStableStringify: (input: any) => string
  export = fastJsonStableStringify
}

declare module 'babel__core' {
  import { TransformOptions } from 'babel__core/index'
  export * from 'babel__core/index'
  export class OptionManager {
    init(opt: TransformOptions): TransformOptions
  }
}

declare module 'jest-config' {
  import 'jest'
  export const defaults: jest.InitialOptions
}

declare module 'babel-core/lib/transformation/file'

declare module 'yargs-parser' {
  import yargs from 'yargs'
  export = yargs.parse
}
