module.exports = {
  env: {
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'module',
    impliedStrict: true,
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
