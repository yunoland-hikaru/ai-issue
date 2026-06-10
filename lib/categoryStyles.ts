import type { ArticleCategory } from '@/types';

export const CATEGORY_STYLES: Record<ArticleCategory, { bg: string; text: string }> = {
  'AI産業':    { bg: '#EEEDFE', text: '#534AB7' },
  '新ツール':  { bg: '#E1F5EE', text: '#0F6E56' },
  '規制・政策':{ bg: '#FAEEDA', text: '#854F0B' },
  '研究・技術':{ bg: '#E6F1FB', text: '#185FA5' },
  'AI企業':    { bg: '#FAECE7', text: '#993C1D' },
  '半導体':    { bg: '#FEF3C7', text: '#92400E' },
};
