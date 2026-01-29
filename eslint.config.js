import importPlugin from 'eslint-plugin-import'


export default [
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true
      }
    },
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'object-curly-spacing': ['error', 'always'],
      'object-curly-newline': ['error', {
        'ImportDeclaration': 'never',
        'ExportDeclaration': 'never'
      }],
      'import/extensions': ['error', 'always', {
        'js': 'always',
        'json': 'always'
      }]
    }
  }
]
