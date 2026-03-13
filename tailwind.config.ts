import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        black: "#090909",
        surface: {
          DEFAULT: "#111111",
          2: "#1c1c1e",
          3: "#2c2c2e",
        },
        cream: "#f5f2ed",
        accent: {
          DEFAULT: "#e8ff47",
          dark: "#c9e000",
        },
        org: {
          akc: "#85b7eb",
          usdaa: "#e8ff47",
          cpe: "#5dcaa5",
          uki: "#ed93b1",
          nadac: "#fac775",
          ckc: "#afa9ec",
        },
        status: {
          low: "#f09595",
          open: "#5dcaa5",
          soon: "#fac775",
          reg: "#e8ff47",
        },
      },
      borderRadius: {
        sm: "10px",
        md: "14px",
        lg: "20px",
        xl: "28px",
      },
    },
  },
  plugins: [],
};

export default config;
