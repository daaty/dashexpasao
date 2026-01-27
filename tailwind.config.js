/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // DashTrans Theme Colors
        'dt': {
          'body': '#0c1929',
          'card': 'rgb(255 255 255 / 5%)',
          'primary': '#3b82f6',
          'success': '#08a50e',
          'warning': '#ffc107',
          'danger': '#f62718',
          'info': '#22d3ee',
        },
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: 'rgb(255 255 255 / 15%)',
          foreground: 'rgb(255 255 255 / 85%)',
        },
        background: '#0c1929',
        foreground: 'rgb(255 255 255 / 70%)',
        card: {
          DEFAULT: 'rgb(255 255 255 / 5%)',
          foreground: 'rgb(255 255 255 / 85%)',
        },
        popover: {
          DEFAULT: '#1e1e1e',
          foreground: 'rgb(255 255 255 / 85%)',
        },
        muted: {
          DEFAULT: 'rgb(255 255 255 / 12%)',
          foreground: 'rgb(255 255 255 / 50%)',
        },
        accent: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#f62718',
          foreground: '#ffffff',
        },
        border: 'rgb(255 255 255 / 15%)',
        input: 'rgb(255 255 255 / 8%)',
        ring: '#3b82f6',
        chart: {
          '1': '#3b82f6',
          '2': '#22d3ee',
          '3': '#886aea',
          '4': '#08a50e',
          '5': '#ffc107',
        },
        'base-100': 'rgb(255 255 255 / 5%)',
        'base-200': 'rgb(255 255 255 / 8%)',
        'base-300': 'rgb(255 255 255 / 12%)',
        'base-400': 'rgb(255 255 255 / 15%)',
        'content': 'rgb(255 255 255 / 70%)',
        'dark-100': 'rgb(255 255 255 / 12%)',
        'dark-200': 'rgb(0 0 0 / 20%)',
        'dark-300': '#1e1e1e',
        'dark-content': 'rgb(255 255 255 / 70%)',
      },
      borderRadius: {
        lg: '10px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        sm: '0 .1rem .3rem rgba(0, 0, 0, .12)',
        DEFAULT: '0 .3rem .8rem rgba(0, 0, 0, .12)',
        md: '0 .3rem .8rem rgba(0, 0, 0, .12)',
        lg: '0 .5rem 1rem rgba(0, 0, 0, .3)',
        xl: '0 1rem 2rem rgba(0, 0, 0, .4)',
        '2xl': '0 1.5rem 3rem rgba(0, 0, 0, .5)',
      },
    },
  },
  plugins: [],
}
