// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores del club - AJUSTA ESTOS VALORES
        club: {
          DEFAULT: '#7c0613',     // Rojo principal
          dark: '#4a030b',        // Rojo oscuro
          light: '#9e1a2a',       // Rojo más claro
          gradient: '#a01c2c',    // Para gradientes
        },
        primary: {
          50: '#fdf2f2',
          100: '#fbe5e5',
          200: '#f7cbcb',
          300: '#f3b1b1',
          400: '#eb7d7d',
          500: '#e34949',  // Cambia este al color de tu club
          600: '#cc2b2b',
          700: '#7c0613',  // Rojo principal
          800: '#5c0910',
          900: '#4a030b',  // Rojo oscuro
        },
      },
      backgroundImage: {
        'club-gradient': 'linear-gradient(135deg, #7c0613 0%, #4a030b 100%)',
        'club-gradient-hover': 'linear-gradient(135deg, #8e0716 0%, #5c040e 100%)',
      },
    },
  },
  plugins: [],
};

export default config;