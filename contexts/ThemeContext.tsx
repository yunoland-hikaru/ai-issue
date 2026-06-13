'use client';

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggleTheme: () => {} });

// テーマは <html> の `dark` クラスを正本とする外部ストア。
// ハイドレーション前に layout.tsx の inline script がクラスを確定させるため、
// useSyncExternalStore の getSnapshot がその確定値を読む（mismatch なし）。
function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function subscribe(callback: () => void) {
  window.addEventListener('themechange', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('themechange', callback);
    window.removeEventListener('storage', callback);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new Event('themechange'));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    applyTheme(getSnapshot() === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
