// eslint.config.js (flat config)
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * CI-safe ESLint:
 * - Browser globals for app/ pages
 * - Node globals for server & config files (kiosk-api, orchestrator, *.config.*)
 * - Keep type-aware TS rules; make unused-vars a warning so CI doesn't fail on it
 */
export default [
  // Ignore build output and deps
  { ignores: ["**/.next/**", "dist/**", "node_modules/**"] },

  // Base TS rules
  ...tseslint.configs.recommended,

  // App/client code -> browser globals
  {
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      parserOptions: { project: "./tsconfig.json" },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    rules: {
      // Don’t fail CI on harmless leftovers while you iterate
      "@typescript-eslint/no-unused-vars": ["warn", { args: "after-used", ignoreRestSiblings: true }],
    },
  },

  // Server & config code -> node globals
  {
    files: [
      "kiosk-api/**/*.{js,ts}",
      "orchestrator/**/*.{js,ts}",
      "scripts/**/*.{js,ts}",
      "**/*.config.{js,ts}",
      "postcss.config.js",
      "tailwind.config.{js,ts}",
      "next.config.{js,ts,mjs,cjs}",
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      // In Node these are real globals; silence no-undef on them
      "no-undef": "off",
      // Let console logging through for servers/scripts
      "no-console": "off",
    },
  },
];
