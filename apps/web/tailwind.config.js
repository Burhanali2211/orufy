import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', ...defaultTheme.fontFamily.sans],
        serif: ['"Playfair Display"', 'Georgia', ...defaultTheme.fontFamily.serif],
      },
      // Enhanced typography scale with proper line heights and letter spacing
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.005em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      colors: {
          // Orufy - Organic & Natural Color Palette
          primary: {
            50: '#faf9f6',   // Linen white
            100: '#f5f2ed',  // Off-white linen
            200: '#e8e2d5',  // Sand stone
            300: '#d9d1bc',  // Driftwood light
            400: '#c0b393',  // Rattan medium
            500: '#8c7e5a',  // Antique gold / Woven straw
            600: '#73684a',  // Deep straw
            700: '#5c533b',  // Dark bark
            800: '#453e2d',  // Deep earth
            900: '#2e291e',  // Maximum contrast
            DEFAULT: '#8c7e5a',
            dark: '#5c533b',
            light: '#c0b393',
          },
          secondary: {
            50: '#fcfaf8',   // Soft cotton
            100: '#f9f5f1',  // Natural cotton
            200: '#f1e8de',  // Bleached wood
            300: '#e9dbcb',  // Pine wood
            400: '#bc9d84',  // Tan leather
            500: '#8e6c4f',  // Saddle leather
            600: '#735740',  // Dark leather
            700: '#594432',  // Coffee
            800: '#3e2f23',  // Deep coffee
            900: '#231b14',  // Maximum dark
            DEFAULT: '#8e6c4f',
            light: '#bc9d84',
            dark: '#594432',
          },
          // Accent colors - Organic leaf/moss greens
          accent: {
            50: '#f4f7f4',   // Pale leaf
            100: '#e9efe9',  // Soft sage
            200: '#d3e0d3',  // Sage green
            300: '#a7c1a7',  // Moss light
            400: '#7ba27b',  // Garden green
            500: '#4f834f',  // Forest green - accent color
            600: '#3f693f',  // Deep forest
            700: '#2f4f2f',  // Dark moss
            DEFAULT: '#4f834f',
            dark: '#2f4f2f',
            light: '#a7c1a7',
          },
        // Essential UI state colors
        state: {
          success: '#166534',     // Rich success green
          error: '#991b1b',       // Deep error red
          warning: '#92400e',     // Burnt orange warning
          info: '#1e40af',        // Classic blue info
        },
        // Sophisticated neutral palette
        neutral: {
          50: '#fafafa',    // Neutral background
          100: '#f4f4f5',   // Sidebar background
          200: '#e4e4e7',   // Borders
          300: '#d4d4d8',   // Muted borders
          400: '#a1a1aa',   // Secondary text light
          500: '#71717a',   // Secondary text
          600: '#52525b',   // Primary text light
          700: '#3f3f46',   // Primary text
          800: '#27272a',   // Heading text
          900: '#18181b',   // Darkest text
          950: '#09090b',   // Pure black
        },
        // Background system
        background: {
          primary: '#fafafa',     // Main background
          secondary: '#ffffff',   // Card backgrounds
          tertiary: '#f4f4f5',    // Overlay/accent background
        },
        // Text system
        text: {
          primary: '#18181b',     // Main text
          secondary: '#3f3f46',   // Secondary text
          tertiary: '#71717a',    // Muted text
          inverse: '#fafafa',     // Light text on dark
        },
        // Trust and conversion colors
        trust: {
          blue: '#1e3a8a',        // Deep trust blue
          green: '#166534',       // Trust green
        },
        conversion: {
          urgency: '#991b1b',     // Action urgency red
          warning: '#92400e',     // Caution amber
        },
      },

      // Luxury spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Sophisticated shadow system
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'luxury': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'luxury-lg': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        'luxury-xl': '0 50px 100px -20px rgba(0, 0, 0, 0.35)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'focus': '0 0 0 3px rgba(71, 85, 105, 0.1)',
      },
      // Enhanced border radius for luxury feel
      borderRadius: {
        'luxury': '0.75rem',
        'luxury-lg': '1rem',
        'luxury-xl': '1.5rem',
      },
      // Animations removed for performance
    }
  },
  plugins: [],
};
