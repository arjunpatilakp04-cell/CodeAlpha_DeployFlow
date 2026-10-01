/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0C',
        surface: '#131316',
        'surface-2': '#1A1A1E',
        border: '#232328',
        text: '#F4F4F5',
        muted: '#8B8B93',
        accent: '#5B8DEF',
        success: '#10B981',
        warning: '#F5A623',
        danger: '#EF4444',
        skip: '#6B6B76',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
