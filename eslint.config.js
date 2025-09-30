// eslint.config.js (flat config)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  // 1) Ignore everything we don't want to lint in CI
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "public/**",
      "docs/**",
      "kiosk-api/**",
      "orchestrator/**",
      "sandbox/**",
      // build & config files we don't want to lint in this project
      "postcss.config.js",
      "tailwind.config.*",
      "eslint.config.js",
    ],
  },

  // 2) Base JS rules (not really used because we ignore most JS, but harmless)
  {
    ...js.configs.recommended,
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node, // makes console, process, Buffer, module defined
    },
  },

  // 3) TypeScript across your Next app only
  ...tseslint.config(
    {
      files: ["app/**/*.{ts,tsx}", "types/**/*.d.ts"],
      languageOptions: {
        // IMPORTANT: no "project"; use the Project Service to avoid parser spam
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        // keep defaults; tweak only what is noisy for your codebase
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      },
    },

    // 4) In declaration files, allow 'any' (or keep if you switch to unknown)
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    }
  ),
];
