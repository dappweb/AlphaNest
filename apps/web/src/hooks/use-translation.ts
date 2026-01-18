'use client';

import { useLanguage } from '@/stores/language-store';
import { translations } from '@/lib/i18n/translations';

export function useTranslation() {
  const { language, setLanguage, toggleLanguage, isHydrated } = useLanguage();
  
  // Always use English translations
  const t = translations.en;
  
  return {
    t,
    language: 'en' as const,
    setLanguage,
    toggleLanguage,
    isHydrated,
  };
}

export function useT() {
  // Always return English translations
  return translations.en;
}
