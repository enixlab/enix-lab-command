import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#020203',
        brand: '#0047FF',
        'brand-dim': '#0039CC',
        cyan: '#00FFFF',
        's1': '#0a0a0d',
        's2': '#111116',
        's3': '#1a1a1f',
        's4': '#252528',
        success: '#00cc5a',
        warning: '#ff9900',
        danger: '#ff2244',
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,71,255,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,71,255,0.7), 0 0 80px rgba(0,71,255,0.2)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
