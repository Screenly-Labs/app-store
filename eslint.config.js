import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Generated output and vendored/legacy theme code are not linted.
    ignores: [
      'public/**',
      'resources/**',
      'node_modules/**',
      'assets/js/vendor/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-globals': 'error',
      'no-console': 'warn',
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
];
