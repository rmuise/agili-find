'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

export type Theme = 'dark' | 'light' | 'auto';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'auto',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'auto' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
    const initial: Theme =
      stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
    setThemeState(initial);
    setResolvedTheme(applyTheme(initial));

    // Listen for system preference changes when in auto mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const current = (localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null) ?? 'auto';
      if (current === 'auto') {
        setResolvedTheme(applyTheme('auto'));
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEYS.THEME, t);
    setResolvedTheme(applyTheme(t));
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
