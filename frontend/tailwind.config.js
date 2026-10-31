/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F8FC',
        surface: '#FFFFFF',
        text: '#1B1F3B',
        primary: {
          DEFAULT: '#6C4BFF',
          dark: '#5839e6',
          light: '#8B70FF'
        },
        accent: {
          DEFAULT: '#00C2A8',
          dark: '#009e89'
        },
        warm: '#FF7A59',
        highlight: '#FFC93C'
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px'
      }
    },
  },
  plugins: [],
}
