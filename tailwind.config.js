/** @type {import('tailwindcss').Config} */

// Rebrand "editorial calmo": remapeia as escalas usadas em toda a app para a
// nova paleta (verde profundo + neutros quentes/greige). Como as secções usam
// classes Tailwind emerald-*/slate-*/gray-*, alterar aqui muda a app inteira.
const emerald = {
  50:  '#eef3ef', 100: '#d9e7df', 200: '#b3cfc0', 300: '#82b09b', 400: '#3f9070',
  500: '#0b6b4f', 600: '#0a5f47', 700: '#084c39', 800: '#073c2d', 900: '#052e23', 950: '#03201a',
};
const warm = {
  50:  '#f6f5f0', 100: '#eeece4', 200: '#e4e2d8', 300: '#cfccbf', 400: '#8a978e',
  500: '#5c6b62', 600: '#46534b', 700: '#2c3b33', 800: '#1e2a23', 900: '#14231c', 950: '#0d1712',
};

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald,
        green: emerald,
        slate: warm,
        gray:  warm,
        neutral: warm,
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
