/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:         '#BECA5C',
        'brand-deep':  '#6E7733',
        'brand-deep2': '#8B9633',
        ink:           '#23241C',
        body:          '#6B6A60',
        muted:         '#9C9A8C',
        canvas:        '#F6F4EC',
        'canvas-alt':  '#F1EEE3',
        surface:       '#FFFFFF',
        'surface-tint':'#EEF0DC',
        hairline:      '#E6E3D8',
        'field-border':'#DCD8C9',
        success:       '#7E9A3E',
        warn:          '#B08A3C',
        alert:         '#C0744E',
        'alert-bg':    '#FBEFE8',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans:  ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono:  ['Spline Sans Mono', 'monospace'],
      },
      maxWidth: {
        content: '1320px',
        wide:    '1080px',
        mid:     '980px',
        narrow:  '760px',
        thin:    '720px',
        form:    '400px',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        cross: {
          '0%,42%':   { opacity: '1' },
          '50%,92%':  { opacity: '0' },
          '100%':     { opacity: '1' },
        },
        cross2: {
          '0%,42%':   { opacity: '0' },
          '50%,92%':  { opacity: '1' },
          '100%':     { opacity: '0' },
        },
        scan: {
          '0%':   { top: '4%' },
          '50%':  { top: '92%' },
          '100%': { top: '4%' },
        },
        fadeup: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulsedot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '.35', transform: 'scale(.7)' },
        },
        bar: { from: { width: '0' } },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-7px)' },
        },
        rotatez: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        marquee:      'marquee 34s linear infinite',
        cross:        'cross 7s ease-in-out infinite',
        cross2:       'cross2 7s ease-in-out infinite',
        scan:         'scan 1.6s ease-in-out infinite',
        fadeup:       'fadeup 0.7s ease both',
        'fadeup-slow':'fadeup 0.9s ease both',
        pulsedot:     'pulsedot 1.6s infinite',
        bar:          'bar 1.1s ease',
        'bar-slow':   'bar 1.3s ease',
        float:        'float 3s ease-in-out infinite',
        spinner:      'rotatez 0.9s linear infinite',
      },
    },
  },
  plugins: [],
};
