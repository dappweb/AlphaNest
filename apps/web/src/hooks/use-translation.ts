'use client';

import { useLanguage } from '@/stores/language-store';
import { translations } from '@/lib/i18n/translations';

export function useTranslation() {
  const { language, setLanguage, toggleLanguage, isHydrated } = useLanguage();
  
  const t = translations[language];
  
  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isHydrated,
  };
}

export function useT() {
  const { language } = useLanguage();
  return translations[language];
}
