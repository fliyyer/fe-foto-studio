/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Custom palette from the provided colors.
      colors: {
        brand: {
          teal: '#00bfc3',
          pink: '#ff2273',
          yellow: '#ffd33b',
          white: '#ffffff',
          black: '#000000',
        },
      },
    },
  },
  plugins: [],
};
