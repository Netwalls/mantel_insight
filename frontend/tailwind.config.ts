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
        background: '#0a0b0f',
        surface: '#111318',
        'surface-2': '#1a1d24',
        'surface-3': '#222630',
        border: '#2a2e3a',
        'border-bright': '#3a3f4e',
        accent: {
          green: '#00ff88',
          'green-dim': '#00cc6a',
          red: '#ff4444',
          'red-dim': '#cc3333',
          yellow: '#ffcc00',
          blue: '#4488ff',
          purple: '#9966ff',
          orange: '#ff8800',
        },
        text: {
          primary: '#e8eaf0',
          secondary: '#8892a4',
          muted: '#4a5568',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 30s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        glow: {
          'from': { boxShadow: '0 0 5px #00ff88, 0 0 10px #00ff88' },
          'to': { boxShadow: '0 0 15px #00ff88, 0 0 30px #00ff88' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}

export default config
