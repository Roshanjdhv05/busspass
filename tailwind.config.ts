import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { 50: "#EEF6F2", 100: "#D5E8DE", 200: "#A9D0BC", 300: "#6FAF8F", 400: "#3E8A66", 500: "#1F6B4C", 600: "#155A3F", 700: "#0F4A34", 800: "#0B3B2A", 900: "#072A1D" },
        mint: { 50: "#F0FBF5", 100: "#DDF6E8", 200: "#BCEBD2", 300: "#8FDDB6", 400: "#5FCB99", 500: "#3DB67F" },
        cream: "#F6F5F0",
        ink: { DEFAULT: "#1E2522", soft: "#4A5550", mute: "#7B8680" },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"] },
      boxShadow: {
        soft: "0 1px 2px rgba(15,74,52,.04), 0 6px 20px -8px rgba(15,74,52,.12)",
        lift: "0 2px 4px rgba(15,74,52,.06), 0 18px 40px -16px rgba(15,74,52,.28)",
      },
      screens: { xs: "380px" },
    },
  },
  plugins: [],
};
export default config;
