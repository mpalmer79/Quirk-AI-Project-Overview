// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    // Next.js app router & components
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Static docs site + any loose html/js in docs
    "./docs/**/*.{html,js}",

    // If you render any HTML from public (optional)
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        quirk: {
          green: "#0b6e37"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

