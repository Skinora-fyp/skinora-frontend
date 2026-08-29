import { useTheme } from '../context/ThemeContext';

// Small sun/moon switch — drop into any header. Reads/writes the shared theme.
export default function ThemeToggle({ style }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle color theme"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: '50%',
        border: '1px solid var(--color-hairline)',
        background: 'var(--color-surface)',
        color: 'var(--color-body)',
        cursor: 'pointer', fontSize: 15, lineHeight: 1,
        transition: 'background .15s, border-color .15s, transform .12s',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-canvas-alt)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
