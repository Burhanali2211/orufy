import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Core react-hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React-hooks v7 strict rules — warn only (require deeper refactoring)
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/hooks': 'warn',
      'react-hooks/capitalized-calls': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/void-use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/memo-dependencies': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/memoized-effect-dependencies': 'warn',
      'react-hooks/exhaustive-effect-dependencies': 'warn',
      'react-hooks/no-deriving-state-in-effects': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/invariant': 'warn',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Standard rules
      'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'info'] }],
      'no-debugger': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-assignment': 'warn',
      'prefer-spread': 'warn',
      'preserve-caught-error': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  }
);
