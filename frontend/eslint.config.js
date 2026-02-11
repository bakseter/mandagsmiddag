import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.all,
            tseslint.configs.strict,
            tseslint.configs.stylistic,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            eslintConfigPrettier,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        rules: {
            'sort-keys': 'off',
            'one-var': 'off',
            'no-ternary': 'off',
            '@typescript-eslint/no-invalid-void-type': 'off', // used by RTK Query
            'max-lines-per-function': 'off',
            'no-warning-comments': 'off',
            'no-console': 'warn',
            'class-methods-use-this': 'warn', // TODO: don't use classes and enable this again
        },
    },
]);
