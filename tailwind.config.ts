import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ph-blue': '#1d3178',
        'ph-red': '#CE1126',
        'ph-yellow': '#ffdf56',
        'primary': '#1d3178',
        'secondary': '#ffdf56',
        blue: {
          50: '#eef0f8',
          100: '#d5d9ed',
          200: '#a8b0d8',
          300: '#7b87c3',
          400: '#4e5fae',
          500: '#1d3178',
          600: '#1a2c6c',
          700: '#162560',
          800: '#111d4e',
          900: '#0c153c',
          950: '#070d27',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-once': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'bounce-once': 'bounce-once 0.3s ease-in-out',
        'float-slow': 'float-slow 4s ease-in-out infinite',
        'float-medium': 'float-medium 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
