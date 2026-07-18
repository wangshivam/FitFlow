import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  
  const isDark = theme === 'dark';

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="button"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className={`theme-toggle__icon-wrapper ${isDark ? 'theme-toggle__icon-wrapper--dark' : 'theme-toggle__icon-wrapper--light'}`}>
        <Sun className="theme-toggle__icon theme-toggle__icon--sun" size={20} strokeWidth={2} />
        <Moon className="theme-toggle__icon theme-toggle__icon--moon" size={20} strokeWidth={2} />
      </div>
    </button>
  );
}
