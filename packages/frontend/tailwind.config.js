/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f2540',
        amber: '#f59e0b',
      },
    },
  },
  plugins: [],
};
