import type { ArticleCategory } from '@/types';

export const CATEGORY_STYLES: Record<ArticleCategory, { bg: string; text: string }> = {
  'AI産業':    { bg: '#EEEDFE', text: '#534AB7' },
  'AI技術':    { bg: '#E6F1FB', text: '#185FA5' },
  '規制・政策':{ bg: '#FAEEDA', text: '#854F0B' },
};
