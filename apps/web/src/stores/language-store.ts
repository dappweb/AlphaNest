'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => {
        set({ language: lang });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang;
        }
      },
      toggleLanguage: () => set((state) => {
        const newLang = state.language === 'en' ? 'zh' : 'en';
        if (typeof document !== 'undefined') {
          document.documentElement.lang = newLang;
        }
        return { language: newLang };
      }),
    }),
    {
      name: 'language-state',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export function useLanguageHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useLanguageStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}

export function useLanguage() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();
  const hydrated = useLanguageHydration();
  
  return {
    language: hydrated ? language : 'en',
    setLanguage,
    toggleLanguage,
    isHydrated: hydrated,
  };
}
