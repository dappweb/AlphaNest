'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(systemDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      cycleTheme: () => {
        const current = get().theme;
        const next: Theme = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },
    }),
    {
      name: 'theme-state',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export function useThemeHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useThemeStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}

export function useTheme() {
  const { theme, setTheme, cycleTheme } = useThemeStore();
  const hydrated = useThemeHydration();
  
  // Apply theme on hydration
  useEffect(() => {
    if (hydrated) {
      applyTheme(theme);
    }
  }, [hydrated, theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  return {
    theme: hydrated ? theme : 'dark',
    setTheme,
    cycleTheme,
    isHydrated: hydrated,
  };
}
