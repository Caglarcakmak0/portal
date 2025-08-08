import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Sistem tercihini dinle
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // localStorage'dan tema tercihini yükle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Tema değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  // Aktif tema durumunu hesapla
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemPrefersDark);

  const toggleTheme = () => {
    setThemeMode(prevMode => {
      switch (prevMode) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  const value: ThemeContextType = {
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};