/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCFA',
          100: '#FAF7F2',
          200: '#F0EBE3',
          300: '#E8E2DA',
          400: '#D4CCC2',
        },
        warm: {
          600: '#5C5650',
          700: '#3D3833',
          800: '#2A2622',
          900: '#1A1714',
        },
        terracotta: {
          50: '#FDF0EB',
          100: '#F9DDD3',
          500: '#C96442',
          600: '#B25538',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(26, 23, 20, 0.04), 0 1px 2px rgba(26, 23, 20, 0.06)',
        'medium': '0 4px 6px rgba(26, 23, 20, 0.04), 0 2px 4px rgba(26, 23, 20, 0.06)',
      },
    },
  },
  plugins: [],
};
