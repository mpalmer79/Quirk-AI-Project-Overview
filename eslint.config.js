// eslint.config.js (flat config for ESLint v9)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Ignore build output and vendor folders
  { ignores: ['.next/**', 'dist/**', 'out/**', 'node_modules/**'] },

  // Base JS & TS recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-wide defaults (Node + TS)
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
      },
      // Make common globals available everywhere
      globals: {
        // browser (available globally but helpful in mixed env)
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
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // JS-only files: keep Node globals so .js server tooling doesn't error
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

  // ---- Option B: Treat docs/** as browser scripts & declare project globals ----
  {
    files: ['docs/**/*.js', 'docs/**/*.mjs'],
    // These files are executed in the browser; provide browser globals explicitly.
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        // Project-specific globals used by demo scripts
        composeDraftFrontEnd: 'readonly',
        __agentProfile: 'readonly',
      },
    },
    rules: {
      // Some demo strings intentionally include escapes — don't fail the build.
      'no-useless-escape': 'warn',
      // If any docs scripts still reference undeclared browser globals, surface as warn.
      'no-undef': 'warn',
    },
  },
];
