export const LINE_FEED = '\n'
export const TS_TSX_REGEX = /\.tsx?$/
export const JS_JSX_REGEX = /\.jsx?$/
export const DECLARATION_TYPE_EXT = '.d.ts'
// `extensionsToTreatAsEsm` only accepts `.ts`, `.tsx` and `.jsx`. `.js`, `.cjs`, `.mjs` will throw error
export const TS_EXT_TO_TREAT_AS_ESM = ['.ts', '.tsx']
export const JS_EXT_TO_TREAT_AS_ESM = ['.jsx']
export const ALL_ESM_OPTIONS_ENABLED = {
  supportsDynamicImport: true,
  supportsExportNamespaceFrom: true,
  supportsStaticESM: true,
  supportsTopLevelAwait: true,
}
/**
 * @internal
 * See https://jestjs.io/docs/en/configuration#testmatch-arraystring
 */
export const DEFAULT_JEST_TEST_MATCH = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']
