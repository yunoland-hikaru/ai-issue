import type { ArticleCategory, Language } from '@/types';

export const CATEGORY_STYLES: Record<ArticleCategory, { bg: string; text: string }> = {
  'AI産業':    { bg: '#EEEDFE', text: '#534AB7' },
  'AI技術':    { bg: '#E6F1FB', text: '#185FA5' },
  '規制・政策':{ bg: '#FAEEDA', text: '#854F0B' },
};

// カテゴリはDBには日本語(ArticleCategory)で保存される。表示は言語別ラベルに変換する。
export const CATEGORY_LABELS: Record<ArticleCategory, Record<Language, string>> = {
  'AI産業':    { ja: 'AI産業',    ko: 'AI 산업', en: 'AI Industry' },
  'AI技術':    { ja: 'AI技術',    ko: 'AI 기술', en: 'AI Technology' },
  '規制・政策':{ ja: '規制・政策', ko: '규제·정책', en: 'Policy & Regulation' },
};

export function categoryLabel(category: ArticleCategory, lang: Language): string {
  return CATEGORY_LABELS[category]?.[lang] ?? category;
}
