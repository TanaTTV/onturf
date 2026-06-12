import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--black)",
        ink: "var(--ink)",
        // warm off-white — overrides tailwind's pure #fff so text-white is never #fff
        white: "var(--white)",
        muted: "var(--grey-1)",
        hairline: "var(--grey-2)",
        bone: "var(--bone)",
        signal: "var(--signal)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
