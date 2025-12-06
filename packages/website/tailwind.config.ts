import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude primary (terracotta/orange)
        claude: {
          DEFAULT: '#C15F3C',
          hover: '#A8512F',
          light: '#E8B4A0',
          bg: '#FEF7F4',
        },
        // Backgrounds
        surface: {
          primary: '#FFFFFF',
          secondary: '#F9F9F8',
          tertiary: '#F0EFED',
        },
        // Text
        ink: {
          primary: '#1A1A1A',
          secondary: '#666666',
          tertiary: '#999999',
        },
        // Borders
        edge: {
          light: '#E5E5E3',
          DEFAULT: '#D4D4D1',
          dark: '#B8B8B4',
        },
        // Learning mode
        learn: {
          correct: '#22C55E',
          incorrect: '#EF4444',
          pending: '#C15F3C',
        },
      },
      fontFamily: {
        display: ['Copernicus', 'ui-serif', 'Georgia', 'serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
      },
      spacing: {
        sidebar: '260px',
      },
      maxWidth: {
        message: '768px',
      },
      borderRadius: {
        claude: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
