import azTranslations from '@/languages/az-az.json';
import ruTranslations from '@/languages/ru-ru.json';
import enTranslations from '@/languages/en-us.json';

export type Language = 'az-az' | 'ru-ru' | 'en-us';

export const languages: Record<Language, string> = {
  'az-az': 'Azərbaycan',
  'ru-ru': 'Русский',
  'en-us': 'English'
};

export const translations = {
  'az-az': azTranslations,
  'ru-ru': ruTranslations,
  'en-us': enTranslations
};

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = getTranslation('en-us', key);
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

export function getLanguageFromPathname(pathname: string): Language {
  const segments = pathname.split('/');
  const langSegment = segments[1];
  
  if (langSegment && Object.keys(languages).includes(langSegment)) {
    return langSegment as Language;
  }
  
  return 'en-us'; // Default language
}

export function addLanguageToPathname(pathname: string, lang: Language): string {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  
  if (firstSegment && Object.keys(languages).includes(firstSegment)) {
    // Replace existing language
    segments[1] = lang;
  } else {
    // Add language as first segment
    segments.splice(1, 0, lang);
  }
  
  return segments.join('/');
}

export function removeLanguageFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  
  if (firstSegment && Object.keys(languages).includes(firstSegment)) {
    segments.splice(1, 1);
  }
  
  return segments.join('/');
} 