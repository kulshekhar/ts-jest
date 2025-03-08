import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { FlatCompat } from '@eslint/eslintrc'
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import importPlugin from 'eslint-plugin-import'
import jestPlugin from 'eslint-plugin-jest'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
  allConfig: eslint.configs.all,
})
const eslintPluginPrettier = compat.extends('plugin:prettier/recommended')

export default tseslint.config(
  {
    ignores: ['**/dist', '**/node_modules', '**/coverage', 'website/build', 'website/.docusaurus'],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  importPlugin.flatConfigs.recommended,
  jestPlugin.configs['flat/recommended'],
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'jest/no-conditional-expect': 'off',
    },
  },
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          // this is the default order except for added `internal` in the middle
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'no-unused-vars': 'off',
      'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],
    },
  },
)
