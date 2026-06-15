import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getClient } from '@/lib/supabase';
import { dummyArticles } from '@/lib/dummy';
import { isLocale } from '@/lib/i18n';
import type { Article, Language } from '@/types';
import ArticleView from './ArticleView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// generateMetadata と本体で同じ記事を使うため React cache で1リクエスト1回に。
const getArticle = cache(async (id: string): Promise<Article | null> => {
  try {
    const { data } = await getClient().from('articles').select('*').eq('id', id).maybeSingle();
    if (data) return data as Article;
  } catch { /* Supabase未設定 */ }
  return dummyArticles.find((a) => a.id === id) ?? null;
});

function pickByLang(article: Article, lang: Language, field: 'title' | 'summary'): string {
  if (field === 'title') {
    return (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  }
  return (lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : null) ?? article.summary_ja ?? '';
}

// 全ロケール分の hreflang alternates。
function languageAlternates(id: string): Record<string, string> {
  return {
    ja: `${SITE_URL}/ja/news/${id}`,
    ko: `${SITE_URL}/ko/news/${id}`,
    en: `${SITE_URL}/en/news/${id}`,
    'x-default': `${SITE_URL}/en/news/${id}`,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const article = await getArticle(id);
  if (!article) {
    return { title: '記事が見つかりません', robots: { index: false, follow: false } };
  }

  const title = pickByLang(article, lang, 'title');
  const description = pickByLang(article, lang, 'summary').slice(0, 200) || undefined;
  const url = `${SITE_URL}/${lang}/news/${id}`;
  const images = article.image_url ? [article.image_url] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(id) },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      images,
      publishedTime: article.created_at,
      siteName: 'AI issue',
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const article = await getArticle(id);

  // Supabase未設定など完全に見つからない場合のみダミーで描画（本番では発生しない）。
  const resolved = article ?? dummyArticles[0];

  // 構造化データ（NewsArticle）— 検索のリッチ結果/Google Newsに有利。
  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: pickByLang(article, lang, 'title'),
        description: pickByLang(article, lang, 'summary') || undefined,
        image: article.image_url ? [article.image_url] : undefined,
        datePublished: article.created_at,
        dateModified: article.created_at,
        inLanguage: lang,
        mainEntityOfPage: `${SITE_URL}/${lang}/news/${id}`,
        author: { '@type': 'Organization', name: article.source_name || 'AI issue' },
        publisher: { '@type': 'Organization', name: 'AI issue' },
      }
    : null;

  // パンくず構造化データ（ホーム → 記事）。
  const homeLabel = lang === 'ko' ? '홈' : lang === 'en' ? 'Home' : 'ホーム';
  const breadcrumb = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: homeLabel, item: `${SITE_URL}/${lang}` },
          { '@type': 'ListItem', position: 2, name: pickByLang(article, lang, 'title'), item: `${SITE_URL}/${lang}/news/${id}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      )}
      <ArticleView initialArticle={resolved} />
    </>
  );
}
