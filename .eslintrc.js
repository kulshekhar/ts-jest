module.exports = {
  env: {
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    impliedStrict: true,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],
  },
}
