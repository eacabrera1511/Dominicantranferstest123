import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeToggleProps {
  scrolled?: boolean;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle({ scrolled = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-2xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-300/50 dark:hover:bg-white/20 border border-slate-300/50 dark:border-white/20 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-all duration-500 hover:shadow-lg active:scale-95 ${
        scrolled ? 'w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7' : 'w-7 h-7 xs:w-9 xs:h-9 sm:w-10 sm:h-10'
      }`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className={`transition-all duration-500 ${scrolled ? 'w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3' : 'w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5'}`} />
      ) : (
        <Moon className={`transition-all duration-500 ${scrolled ? 'w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3' : 'w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5'}`} />
      )}
    </button>
  );
}
