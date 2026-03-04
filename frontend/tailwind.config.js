/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aura: {
          bg: "#0a0a0f",
          card: "#131320",
          "card-hover": "#1a1a2e",
          accent: "#e94560",
          purple: "#7b2ff7",
          "purple-light": "#9d5cff",
          gold: "#fbbf24",
          text: "#eaeaea",
          muted: "#6b7280",
          border: "#1f2037",
          "border-hover": "#2d2d4a",
        },
        background: "#0a0a0f",
        foreground: "#eaeaea",
        card: {
          DEFAULT: "#131320",
          foreground: "#eaeaea",
        },
        muted: {
          DEFAULT: "#1a1a2e",
          foreground: "#6b7280",
        },
        border: "#1f2037",
      },
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(123, 47, 247, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(123, 47, 247, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
