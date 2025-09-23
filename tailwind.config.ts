import type { Config } from 'tailwindcss'

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
        // Brand colors (RED/BLACK/WHITE theme)
        brand: {
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          black: '#000000',
          white: '#ffffff',
        },
        // Dark mode colors
        dark: {
          bg: {
            primary: '#000000',
            secondary: '#0a0a0a',
            tertiary: '#141414',
          },
          surface: {
            primary: '#1a1a1a',
            secondary: '#242424',
            tertiary: '#2e2e2e',
          },
          border: {
            primary: '#333333',
            secondary: '#404040',
          },
          text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
            tertiary: '#707070',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Mobile-first responsive text scale
        'xs': ['12px', { lineHeight: '1.5' }],     // Labels, captions
        'sm': ['14px', { lineHeight: '1.5' }],     // Mobile base text (Requirement 1.1)
        'base': ['16px', { lineHeight: '1.5' }],   // Desktop base, critical mobile text (Requirement 1.4)
        'lg': ['18px', { lineHeight: '1.5' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['30px', { lineHeight: '1.3' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.1' }],
        '6xl': ['60px', { lineHeight: '1' }],
        '7xl': ['72px', { lineHeight: '1' }],
        '8xl': ['96px', { lineHeight: '1' }],
        '9xl': ['128px', { lineHeight: '1' }],
        // Custom statistics text utilities (Requirements 7.1, 7.3)
        'stat-primary': ['32px', { lineHeight: '1.2' }],     // Mobile primary stats
        'stat-primary-lg': ['48px', { lineHeight: '1.1' }],  // Desktop primary stats
        'stat-secondary': ['24px', { lineHeight: '1.3' }],   // Mobile secondary stats
        'stat-secondary-lg': ['32px', { lineHeight: '1.2' }], // Desktop secondary stats
        'stat-label': ['12px', { lineHeight: '1.5', letterSpacing: '0.05em', textTransform: 'uppercase' }], // Stat labels
      },
      lineHeight: {
        // Additional line height utilities for flexibility
        'tight': '1.1',
        'snug': '1.3',
        'normal': '1.5',      // Body text standard (Requirement 1.5)
        'relaxed': '1.6',
        'loose': '2',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      spacing: {
        // Existing custom spacing
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
        // 8px base unit scale (Requirement 4.1)
        '1.5': '6px',       // 0.75 * 8px
        '2.5': '10px',      // 1.25 * 8px
        '3.5': '14px',      // 1.75 * 8px
        '4.5': '18px',      // 2.25 * 8px
        '5.5': '22px',      // 2.75 * 8px
        '6.5': '26px',      // 3.25 * 8px
        '7': '28px',        // 3.5 * 8px
        '7.5': '30px',      // 3.75 * 8px
        '8.5': '34px',      // 4.25 * 8px
        '9': '36px',        // 4.5 * 8px
        '9.5': '38px',      // 4.75 * 8px
        '10': '40px',       // 5 * 8px
        '11': '44px',       // 5.5 * 8px - Touch target standard
        '12': '48px',       // 6 * 8px
        '13': '52px',       // 6.5 * 8px
        '14': '56px',       // 7 * 8px - Mobile header height
        '15': '60px',       // 7.5 * 8px
        '16': '64px',       // 8 * 8px
        '17': '68px',       // 8.5 * 8px
        '18.5': '74px',     // Between 18 and 19
        '19': '76px',       // 9.5 * 8px
        '20': '80px',       // 10 * 8px
        // Touch target specific (Requirements 2.1, 2.2)
        'touch': '44px',          // Standard touch target
        'touch-compact': '40px',  // Compact touch target
        'touch-gap': '8px',       // Gap between touch targets (Requirement 2.3)
      },
      minHeight: {
        // Touch target utilities (Requirements 2.1, 2.2)
        'touch-44': '44px',    // Standard touch target
        'touch-40': '40px',    // Compact touch target with spacing
        'touch': '44px',       // Alias for standard
        'touch-compact': '40px', // Alias for compact
        // Common heights
        '14': '56px',         // Mobile header
        '18': '72px',         // Desktop header
      },
      gap: {
        // Touch-optimized gaps (Requirement 2.3)
        'touch': '8px',        // Minimum gap between touch targets
        'touch-lg': '12px',    // Comfortable gap between touch targets
        'touch-xl': '16px',    // Spacious gap between touch targets
      },
      screens: {
        'xs': '475px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Compact component utilities (Task 3: ui-sizing-fix)
      components: {
        // Compact button utility
        '.btn-compact': {
          minHeight: '40px',              // touch-compact
          padding: '10px 16px',           // 2.5 vertical, 4 horizontal
          fontSize: '14px',               // sm
          lineHeight: '1.5',
          borderRadius: '6px',            // 1.5
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',                     // 1.5
          transition: 'all 150ms ease-in-out',
          '&:focus': {
            outline: '2px solid transparent',
            outlineOffset: '2px',
            boxShadow: '0 0 0 2px rgb(239 68 68 / 0.5)', // brand-red-500 with opacity
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          }
        },

        // Compact input utility
        '.input-compact': {
          minHeight: '40px',              // touch-compact
          padding: '8px 12px',            // 2 vertical, 3 horizontal
          fontSize: '14px',               // sm
          lineHeight: '1.5',
          borderRadius: '6px',            // 1.5
          border: '1px solid #d1d5db',    // gray-300
          backgroundColor: '#ffffff',
          transition: 'all 150ms ease-in-out',
          '&:focus': {
            outline: '2px solid transparent',
            outlineOffset: '2px',
            borderColor: '#dc2626',       // brand-red-600
            boxShadow: '0 0 0 1px #dc2626', // brand-red-600
          },
          '&:disabled': {
            backgroundColor: '#f9fafb',   // gray-50
            color: '#9ca3af',             // gray-400
            cursor: 'not-allowed',
          },
          '&::placeholder': {
            color: '#9ca3af',             // gray-400
          }
        },

        // Compact card utility
        '.card-compact': {
          padding: '16px',                // 4
          borderRadius: '8px',            // 2
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',    // gray-200
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // shadow-sm
          transition: 'all 150ms ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            backgroundColor: '#1a1a1a',   // dark.surface.primary
            borderColor: '#333333',      // dark.border.primary
            color: '#ffffff',            // dark.text.primary
          },
          '.dark &': {
            backgroundColor: '#1a1a1a',   // dark.surface.primary
            borderColor: '#333333',      // dark.border.primary
            color: '#ffffff',            // dark.text.primary
          }
        }
      }
    },
  },
  plugins: [],
}