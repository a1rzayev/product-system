'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/i18n';

const flags: Record<Language, string> = {
  'az-az': '🇦🇿',
  'ru-ru': '🇷🇺',
  'en-us': '🇺🇸',
};

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-block text-left">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black"
        style={{ color: 'black' }}
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code}>
            {flags[code as Language]} {name}
          </option>
        ))}
      </select>
    </div>
  );
} 