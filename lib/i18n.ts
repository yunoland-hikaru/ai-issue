import type { Language } from '@/types';

// パスベース多言語ルーティング: /ja /ko /en。既定(x-default)は en（韓国KR→ko / 日本JP→ja / それ以外→en）。
export const LOCALES: Language[] = ['ja', 'ko', 'en'];
export const DEFAULT_LOCALE: Language = 'en';

export function isLocale(value: string | undefined | null): value is Language {
  return value === 'ja' || value === 'ko' || value === 'en';
}

/** 内部リンク用にロケール接頭辞を付与。localePath('ko','/news/1') -> '/ko/news/1'、localePath('ja','/') -> '/ja' */
export function localePath(lang: Language, path: string): string {
  if (!path || path === '/') return `/${lang}`;
  return `/${lang}${path.startsWith('/') ? path : `/${path}`}`;
}
