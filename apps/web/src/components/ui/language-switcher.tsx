'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    setCurrentLocale(locale);
    // Store in cookie/localStorage
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    setIsOpen(false);
    // Reload to apply new locale
    window.location.reload();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeFlags[currentLocale]}</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-lg border bg-background p-1 shadow-lg">
            {locales.map((locale) => (
              <button
                key={locale}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary ${
                  currentLocale === locale ? 'bg-secondary' : ''
                }`}
                onClick={() => handleLocaleChange(locale)}
              >
                <span>{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
