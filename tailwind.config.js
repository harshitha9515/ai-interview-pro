/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060911',
          900: '#090D16',
          850: '#0D1424',
          800: '#111A30',
          700: '#1B2744',
          600: '#26375E',
        },
        brand: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          purple: '#a855f7',
          blue: '#3b82f6',
          indigo: '#6366f1',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-float': 'subtle-float 4s ease-in-out infinite',
        'ripple': 'ripple 2s linear infinite',
        'sound-bar': 'sound-bar 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
          '50%': { opacity: '0.8', filter: 'blur(28px)' },
        },
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'sound-bar': {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.08) 40%, transparent 70%)',
      }
    },
  },
  plugins: [],
}
