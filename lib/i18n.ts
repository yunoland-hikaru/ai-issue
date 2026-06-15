import type { Language } from '@/types';

// パスベース多言語ルーティング: /ja /ko /en。x-default は ja。
export const LOCALES: Language[] = ['ja', 'ko', 'en'];
export const DEFAULT_LOCALE: Language = 'ja';

export function isLocale(value: string | undefined | null): value is Language {
  return value === 'ja' || value === 'ko' || value === 'en';
}

/** 内部リンク用にロケール接頭辞を付与。localePath('ko','/news/1') -> '/ko/news/1'、localePath('ja','/') -> '/ja' */
export function localePath(lang: Language, path: string): string {
  if (!path || path === '/') return `/${lang}`;
  return `/${lang}${path.startsWith('/') ? path : `/${path}`}`;
}
