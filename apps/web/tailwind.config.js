/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7E6',
          100: '#CCF0CC',
          200: '#99E099',
          300: '#66D166',
          400: '#33C133',
          500: '#00B200', // Verde principal
          600: '#009E00',
          700: '#008B00',
          800: '#007700',
          900: '#005500',
        },
        dark: {
          100: '#2D2D2D',
          200: '#252525',
          300: '#1E1E1E',
          400: '#171717',
          500: '#121212',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
