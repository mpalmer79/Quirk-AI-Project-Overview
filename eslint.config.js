// eslint.config.js (flat config for ESLint v9)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Ignore build output and vendor folders
  { ignores: ['.next/**', 'dist/**', 'out/**', 'node_modules/**'] },

  // Base JS & TS recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-specific tweaks + (IMPORTANT) register the plugin
  {
    plugins: {
      // This line makes the "@typescript-eslint/…" rules available
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
      },
      // Make Node globals available so "no-undef" doesn’t fire
      globals: {
        // browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // node
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      // match Copilot’s suggestions
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Optional: ensure JS-only files still have Node globals
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
];
