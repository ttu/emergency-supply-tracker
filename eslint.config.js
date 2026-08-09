// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'coverage'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      sonarjs.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: [
          './tsconfig.json',
          './tsconfig.node.json',
          './tsconfig.test.json',
          './tsconfig.storybook.json',
          './tsconfig.e2e.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-max-depth': ['error', { max: 4 }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      // Randomness in this app is only ever used for React keys, log/session
      // ids and seeded example data - never for anything security-sensitive.
      'sonarjs/pseudo-random': 'off',
      // Inline follow-up markers are used deliberately to flag known future
      // work and are not treated as defects.
      'sonarjs/todo-tag': 'off',
      // Redundant with @typescript-eslint/no-unused-vars above, which is
      // type-aware and honours the `_` prefix convention.
      'sonarjs/no-unused-vars': 'off',
      // Type-aware rules, introduced at warn with a ratcheting
      // --max-warnings ceiling (see package.json) rather than error, since
      // the codebase predates type-aware linting and has existing
      // violations to fix incrementally. Promoted to 'error' once a rule's
      // count reaches zero. See docs/CODE_QUALITY.md.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // Off rather than warn/error: at 384 warnings across 116 files, the
      // fix-per-callsite cost (each requires judgment about presence vs.
      // empty-string vs. zero-as-unset intent) outweighs the value here.
      // Revisit if the codebase wants to take this on deliberately.
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    // Tests are named per behaviour on purpose (see docs/TESTING_STRATEGY.md);
    // collapsing them into it.each tables costs more in readability and failure
    // reporting than it saves in lines.
    files: ['**/*.{test,spec}.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      'sonarjs/parameterized-tests': 'off',
      // Assertion patterns match short literal fixtures, never untrusted
      // input, so backtracking cost is irrelevant. The rule stays on for
      // production code, where ReDoS actually matters.
      'sonarjs/super-linear-regex': 'off',
    },
  },
  {
    // The e2e suite synchronises on a shared TIMEOUTS constant. Converting all
    // of it to observable-condition waits is a worthwhile but separate
    // refactor - doing it alongside a lint-config change risks flakiness.
    files: ['e2e/**/*.ts'],
    rules: {
      'sonarjs/no-fixed-wait-in-tests': 'off',
      // advanced-features.spec.ts guards its tests with conditional
      // test.skip() when the UI under test is absent. That is real debt -
      // those tests pass silently instead of failing - but resolving it needs
      // the same E2E pass as the fixed waits above.
      'sonarjs/no-skipped-tests': 'off',
    },
  },
  {
    // Test wrappers legitimately nest context providers deeply; depth there is
    // structural rather than a readability problem.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'react/jsx-max-depth': 'off',
    },
  },
  storybook.configs['flat/recommended'],
);
