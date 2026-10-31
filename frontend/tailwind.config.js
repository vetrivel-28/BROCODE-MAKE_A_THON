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
          hover: '#5A3CE0',
          light: '#F0ECFF',
        },
        accent: {
          DEFAULT: '#00C2A8',
          hover: '#00A892',
          light: '#E6FAF6',
        },
        warm: {
          DEFAULT: '#FF7A59',
          hover: '#E56545',
          light: '#FFF0EC',
        },
        highlight: {
          DEFAULT: '#FFC93C',
          light: '#FFF9E8',
        },
      },
      borderRadius: {
        DEFAULT: '16px',
        lg: '16px',
        xl: '16px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
