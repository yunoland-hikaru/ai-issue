export type Language = 'ja' | 'ko' | 'en';

export type ArticleCategory =
  | 'AI産業'
  | '新ツール'
  | '研究・技術'
  | '規制・政策'
  | '半導体'
  | 'AI企業';

export interface Article {
  id: string;
  title_ja: string;
  title_en?: string;
  title_ko?: string;
  summary_ja?: string;
  summary_en?: string;
  summary_ko?: string;
  content_ja?: string;
  content_ko?: string;
  content_en?: string;
  category: ArticleCategory;
  source_url: string;
  source_name: string;
  thumbnail_url?: string;
  image_url?: string;
  logo_url?: string;
  video_url?: string;
  views?: number;
  published_at: string;
  created_at: string;
}

export type PricingType = 'free' | 'paid' | 'freemium';

export interface Tool {
  id: string;
  name: string;
  description_ja?: string;
  description_en?: string;
  category: string;
  pricing_type: PricingType;
  url?: string;
  upvotes: number;
  created_at: string;
}

export interface TrendingKeyword {
  id: string;
  keyword: string;
  count: number;
  date: string;
}
