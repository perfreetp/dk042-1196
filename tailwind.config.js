/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      colors: {
        ink: {
          50: "#F6F7F7",
          100: "#E6EAEA",
          200: "#CCD3D4",
          300: "#A2AEB0",
          400: "#718184",
          500: "#5A6B6E",
          600: "#3E4D4F",
          700: "#2B383A",
          800: "#1A2B2E",
          900: "#0F1A1C",
        },
        moss: {
          50: "#EFF7F4",
          100: "#D7ECE4",
          200: "#B0D8CA",
          300: "#7EBEAA",
          400: "#4E9C86",
          500: "#2F806B",
          600: "#1F6B5A",
          700: "#1A574A",
          800: "#17453C",
          900: "#133932",
        },
        ember: {
          50: "#FFF3EB",
          100: "#FFE0CC",
          200: "#FFBC91",
          300: "#FF9E61",
          400: "#FF8A3D",
          500: "#F56E17",
          600: "#E25910",
          700: "#BB4510",
          800: "#953814",
          900: "#783115",
        },
        sky2: {
          50: "#EFF8FF",
          100: "#D9EEFF",
          200: "#BCE1FF",
          300: "#8CCEFF",
          400: "#55B2FF",
          500: "#3DA5FF",
          600: "#1F84E0",
          700: "#1769B4",
          800: "#185892",
          900: "#194A78",
        },
        cream: {
          50: "#FDFCFB",
          100: "#FAF8F5",
          200: "#F4EFE7",
          300: "#EAE2D2",
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Source Han Serif SC"', '"思源宋体"', "Georgia", "serif"],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 26, 28, 0.04), 0 8px 24px rgba(31, 107, 90, 0.06)",
        pop: "0 4px 16px rgba(15, 26, 28, 0.08), 0 12px 32px rgba(31, 107, 90, 0.10)",
        ember: "0 4px 14px rgba(255, 138, 61, 0.30)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #1F6B5A 0%, #2F806B 45%, #4E9C86 100%)",
        "cream-soft":
          "radial-gradient(1200px 400px at 0% 0%, rgba(31,107,90,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,138,61,0.05), transparent 60%), #FAF8F5",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        popIn: {
          "0%": { opacity: 0, transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        popIn: "popIn .35s cubic-bezier(.2,.7,.2,1)",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
