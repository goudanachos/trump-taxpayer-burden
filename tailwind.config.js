/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,liquid,md,js}",
    "./src/_includes/**/*.{html,liquid}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep-navy': 'var(--bg-deep-navy)',
        'accent-gold': 'var(--accent-gold)',
        'text-primary': 'var(--text-primary)',
        'text-dark': 'var(--text-dark)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'bg-dark': 'var(--bg-dark)',
        'border-light': 'var(--border-light)',
        'border-medium': 'var(--border-medium)',
        'border-navy': 'var(--border-navy)',
        // Legacy colors for compatibility
        'brand-red': 'var(--brand-red)',
        'brand-blue': 'var(--brand-blue)',
        'brand-red-dark': 'var(--brand-red-dark)',
        'brand-blue-dark': 'var(--brand-blue-dark)',
      },
      fontSize: {
        // Presidential theme type scale (rem units)
        'xs': ['0.875rem', { lineHeight: '1.4' }],   // 14px
        'sm': ['1rem', { lineHeight: '1.4' }],       // 16px  
        'base': ['1rem', { lineHeight: '1.4' }],     // 16px
        'lg': ['1.25rem', { lineHeight: '1.3' }],    // 20px
        'xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px
        '2xl': ['2.25rem', { lineHeight: '1.2' }],   // 36px
        '3xl': ['3rem', { lineHeight: '1.1' }],      // 48px - Hero size
        '4xl': ['3rem', { lineHeight: '1.1' }],      // 48px
        '5xl': ['3rem', { lineHeight: '1.1' }],      // 48px
      },
      fontFamily: {
        'sans': ['Instrument Sans', 'system-ui', 'sans-serif'],
        'serif': ['Instrument Serif', 'Georgia', 'serif'],
        'display': ['Instrument Serif', 'Georgia', 'serif'],
      },
      spacing: {
        // 4pt rhythm
        '1': '0.25rem',  // 4px
        '2': '0.5rem',   // 8px
        '3': '0.75rem',  // 12px
        '4': '1rem',     // 16px
        '6': '1.5rem',   // 24px
        '8': '2rem',     // 32px
        '12': '3rem',    // 48px
        '16': '4rem',    // 64px
      },
      backgroundImage: {
        'flag-gradient': 'linear-gradient(135deg, #DC2626 0%, #FFFFFF 50%, #1E40AF 100%)',
        'stars': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJMMTIuNTkgNy40MUwxOCA3TDE0LjE4IDEwLjU5TDE2IDE2TDEwIDEzTDQgMTZMNS44MiAxMC41OUwyIDdMNy40MSA3LjQxTDEwIDJaIiBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4K')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};