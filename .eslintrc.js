module.exports = {
  env: {
    node: true,
    es6: true,
    'jest/globals': true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: 'tsconfig.eslint.json',
        impliedStrict: true,
        createDefaultProgram: false,
      },
      plugins: ['eslint-plugin-prefer-arrow', 'import', 'jsdoc'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'plugin:import/typescript',
        'plugin:prettier/recommended',
      ],
      rules: {
        '@typescript-eslint/array-type': [
          'error',
          {
            default: 'array-simple',
          },
        ],
        '@typescript-eslint/comma-spacing': 'error',
        '@typescript-eslint/no-redeclare': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/prefer-ts-expect-error': 'error',
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
        'jest/no-conditional-expect': 'off',
        'object-shorthand': 'error',
        'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],
        'prefer-object-spread': 'error',
      },
    },
    {
      files: ['*.js'],
      extends: ['eslint:recommended', 'plugin:prettier/recommended'],
      rules: {
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  ],
  rules: {
    'comma-spacing': 'off',
    'no-redeclare': 'off',
    'no-shadow': 'off',
    quotes: 'off',
  },
}
