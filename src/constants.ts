export const LINE_FEED = '\n'
export const DECLARATION_TYPE_EXT = '.d.ts'
export const JS_JSX_EXTENSIONS = ['.js', '.jsx']
export const TS_TSX_REGEX = /\.[cm]?tsx?$/
export const JS_JSX_REGEX = /\.[cm]?jsx?$/
export const TS_TRANSFORM_PATTERN = '^.+.tsx?$'
export const ESM_TS_TRANSFORM_PATTERN = '^.+\\.m?tsx?$'
export const TS_JS_TRANSFORM_PATTERN = '^.+.[tj]sx?$'
export const ESM_TS_JS_TRANSFORM_PATTERN = '^.+\\.m?[tj]sx?$'
export const JS_TRANSFORM_PATTERN = '^.+.jsx?$'
export const ESM_JS_TRANSFORM_PATTERN = '^.+\\.m?jsx?$'
// `extensionsToTreatAsEsm` will throw error with `.mjs`
export const TS_EXT_TO_TREAT_AS_ESM = ['.ts', '.tsx', '.mts']
export const JS_EXT_TO_TREAT_AS_ESM = ['.jsx']
/**
 * @internal
 * See https://jestjs.io/docs/en/configuration#testmatch-arraystring
 */
export const DEFAULT_JEST_TEST_MATCH = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']
/**
 * @internal
 */
export const JEST_CONFIG_EJS_TEMPLATE = `/** @type {import('ts-jest').JestConfigWithTsJest} **/
<%= exportKind %> {
  testEnvironment: '<%= testEnvironment %>',
  transform: {
    '<%= transformPattern %>': <%- transformValue %>,
  },
};`
