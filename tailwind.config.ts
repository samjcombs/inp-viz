import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "inp-blue": "#2B4B6B",
        "inp-teal": "#3AA99F",
        "inp-burgundy": "#A4264C",
      },
      fontFamily: {
        lato: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
