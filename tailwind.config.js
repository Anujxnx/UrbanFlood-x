/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#092328",
          teal: "#12544F",
          emerald: "#2A835F",
          sage: "#8BBB92",
          "sage-light": "#E8F3ED",
          surface: "#F6FAF8",
          card: "#FFFFFF",
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#12544F',
          600: '#092328',
          700: '#075985',
          900: '#092328',
        },
        risk: {
          low: '#2A835F',
          medium: '#eab308',
          high: '#f97316',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      }
    },
  },
  plugins: [],
}
