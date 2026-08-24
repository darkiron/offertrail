import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@app',
                '@app/**',
                '@routes',
                '@routes/**',
                '@widgets',
                '@widgets/**',
                '@features',
                '@features/**',
                '@entities',
                '@entities/**',
                '**/app',
                '**/app/**',
                '**/routes',
                '**/routes/**',
                '**/widgets',
                '**/widgets/**',
                '**/features',
                '**/features/**',
                '**/entities',
                '**/entities/**',
              ],
              message:
                'shared is the lowest layer and cannot depend on product layers (ADR-0001).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@app',
                '@app/**',
                '@routes',
                '@routes/**',
                '@widgets',
                '@widgets/**',
                '@features',
                '@features/**',
                '**/app',
                '**/app/**',
                '**/routes',
                '**/routes/**',
                '**/widgets',
                '**/widgets/**',
                '**/features',
                '**/features/**',
              ],
              message: 'entities may only depend on shared (ADR-0001).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@app',
                '@app/**',
                '@routes',
                '@routes/**',
                '@widgets',
                '@widgets/**',
                '**/app',
                '**/app/**',
                '**/routes',
                '**/routes/**',
                '**/widgets',
                '**/widgets/**',
              ],
              message:
                'features may only depend on entities and shared (ADR-0001).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@app',
                '@app/**',
                '@routes',
                '@routes/**',
                '**/app',
                '**/app/**',
                '**/routes',
                '**/routes/**',
              ],
              message:
                'widgets may only depend on features, entities and shared (ADR-0001).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@app', '@app/**', '**/app', '**/app/**'],
              message:
                'routes cannot depend on the app composition root (ADR-0001).',
            },
          ],
        },
      ],
    },
  },
]);
