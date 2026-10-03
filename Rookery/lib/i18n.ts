export function t(obj: any, key: string, lang: 'mr' | 'en' = 'en'): string {
  if (!obj) return '';
  const val = obj[`${key}_${lang}`];
  if (val) return val;
  // Fallback to English
  return obj[`${key}_en`] || '';
}
