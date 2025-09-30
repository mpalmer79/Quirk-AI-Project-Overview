// Minimal ESLint v9 "flat config" so CI stops failing.
// Add rules/plugins later if you want real linting.

/// <reference types="eslint" />

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "public/**",
      "docs/**",
      "web/**"
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {},
    rules: {},
  },
];
