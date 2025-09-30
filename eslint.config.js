// eslint.config.js  (ESLint v9 flat config)

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Ignore generated/output & configs you don't want linted
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "public/**",
      "docs/**",
      "web/**",
      "types/**",
      "**/*.d.ts",
      "tailwind.config.*",
      "tailWind.config.*" // in case of that capitalization
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript-aware rules (non type-checked for speed; no project needed)
  ...tseslint.configs.recommended,

  // Ensure TS/TSX is parsed with JSX support
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        // no 'project' -> faster & no need for a lockfile in CI
      },
    },
    rules: {
      // add rules here later if you want
    },
  },
];
