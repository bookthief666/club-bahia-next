import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bahiaBlack: '#050304', midnight: '#0B0B12', charcoal: '#17151A', bahiaRed: '#E1121B', bahiaRedDark: '#A90D15', sunsetGold: '#F6B73C', amberGlow: '#FFCF70', tropicalTeal: '#00A6A6', deepPalm: '#123D31', warmIvory: '#FFF6E8', mutedSand: '#C8B89F', softGray: '#A7A3A0'
      },
      fontFamily: { sans: ['var(--font-inter)'], display: ['var(--font-bebas)'], serif: ['var(--font-playfair)'] },
      boxShadow: { glow: '0 0 32px rgba(225,18,27,.35)', gold: '0 0 28px rgba(246,183,60,.22)' },
      backgroundImage: { 'radial-red': 'radial-gradient(circle at 50% 0%, rgba(225,18,27,.22), transparent 38%)' }
    }
  },
  plugins: []
};
export default config;
