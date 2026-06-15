import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClient } from '@/lib/supabase';
import { isLocale } from '@/lib/i18n';
import type { Article, Language } from '@/types';
import HomeView from './HomeView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// ニュースは頻繁に増えるため1分ごとに再生成（ISR）。SEOの静的配信と鮮度を両立。
export const revalidate = 60;

// ホームの言語別タイトル/説明（共有カード・OG・検索用）。
const HOME_META: Record<Language, { title: string; description: string }> = {
  ja: {
    title: 'AI issue — AIニュースをわかりやすく',
    description: '毎日溢れるAI関連ニュース・新着AIツール情報をAIが自動収集し、わかりやすく届けるメディアです。',
  },
  ko: {
    title: 'AI issue — AI 세상, 매일 한 눈에',
    description: '매일 쏟아지는 AI 관련 뉴스와 신규 AI 툴 정보를 AI가 자동 수집해 알기 쉽게 전달합니다.',
  },
  en: {
    title: 'AI issue — AI news, every day at a glance',
    description: 'AI-curated daily news and new AI tools, made easy to read.',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = HOME_META[lang];
  const url = `${SITE_URL}/${lang}`;
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: {
      canonical: url,
      languages: {
        ja: `${SITE_URL}/ja`,
        ko: `${SITE_URL}/ko`,
        en: `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/en`,
      },
    },
    openGraph: { title: m.title, description: m.description, url },
    twitter: { title: m.title, description: m.description },
  };
}

// 最新20件 + 人気10件をサーバーで取得し初期HTMLに含める（SEO）。
async function getHomeData(): Promise<{ articles: Article[]; popular: Article[] }> {
  try {
    const sb = getClient();
    const [latest, pop] = await Promise.all([
      sb.from('articles').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('articles')
        .select('*')
        .order('views', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    // views列が無い等で人気取得に失敗したら新着順にフォールバック。
    let popular = pop.data ?? [];
    if (pop.error) {
      const fb = await sb.from('articles').select('*').order('created_at', { ascending: false }).limit(10);
      popular = fb.data ?? [];
    }
    return { articles: latest.data ?? [], popular };
  } catch {
    return { articles: [], popular: [] };
  }
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const { articles, popular } = await getHomeData();
  return <HomeView lang={lang} initialArticles={articles} initialPopular={popular} />;
}
