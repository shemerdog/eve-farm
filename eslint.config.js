import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import css from '@eslint/css'

const tsConfigs = tseslint.configs.recommended.map((config) => ({
    ...config,
    files: config.files ?? ['**/*.{ts,tsx,mts,cts}'],
}))

export default [
    {
        ignores: [
            'dist/',
            'test-results/',
            'node_modules/',
            '**/*.md',
            '**/*.json',
            '**/*.jsonc',
        ],
    },
    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        ...js.configs.recommended,
        languageOptions: {
            ...js.configs.recommended.languageOptions,
            globals: { ...globals.browser, ...globals.node },
        },
    },
    ...tsConfigs,
    {
        files: ['**/*.{jsx,tsx}'],
        ...pluginReact.configs.flat.recommended,
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...pluginReact.configs.flat.recommended.rules,
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
        },
    },
    {
        files: ['**/*.{ts,tsx,jsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'prefer-const': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': 'warn',
        },
    },
    {
        files: ['**/*.css'],
        language: 'css/css',
        ...css.configs.recommended,
        rules: {
            ...css.configs.recommended.rules,
            'css/use-baseline': 'off',
            'css/no-invalid-properties': 'off',
        },
    },
    {
        files: ['**/*.test.{ts,tsx}', '**/e2e/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
]
