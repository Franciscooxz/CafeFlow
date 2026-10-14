import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cafe: {
          black:      'rgb(var(--cafe-black) / <alpha-value>)',
          white:      'rgb(var(--cafe-white) / <alpha-value>)',
          cream:      'rgb(var(--cafe-cream) / <alpha-value>)',
          beige:      'rgb(var(--cafe-beige) / <alpha-value>)',
          terracota:  'rgb(var(--cafe-terracota) / <alpha-value>)',
          terracota2: 'rgb(var(--cafe-terracota2) / <alpha-value>)',
          onBrand:    'rgb(var(--cafe-onBrand) / <alpha-value>)',
          gray:       'rgb(var(--cafe-gray) / <alpha-value>)',
          grayLight:  'rgb(var(--cafe-grayLight) / <alpha-value>)',
          grayDark:   'rgb(var(--cafe-grayDark) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'cafe': '0 2px 16px 0 rgba(26,26,26,0.08)',
        'cafe-lg': '0 8px 32px 0 rgba(26,26,26,0.12)',
        'cafe-xl': '0 16px 48px 0 rgba(26,26,26,0.16)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
