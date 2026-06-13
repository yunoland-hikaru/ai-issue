'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TickerBanner from '@/components/TickerBanner';
import TabNav from '@/components/TabNav';
import HeroCard from '@/components/HeroCard';
import NewsCard from '@/components/NewsCard';
import Sidebar from '@/components/Sidebar';
import { dummyArticles, dummyTools, dummyKeywords } from '@/lib/dummy';
import { useLang } from '@/contexts/LangContext';
import type { Article, Tool, TrendingKeyword } from '@/types';

type TabKey = 'top' | 'news' | 'tools' | 'companies' | 'policy' | 'favorites';

export default function Home() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<TabKey>('top');
  const [articles, setArticles] = useState<Article[]>(dummyArticles);
  const [tools, setTools] = useState<Tool[]>(dummyTools);
  const [keywords, setKeywords] = useState<TrendingKeyword[]>(dummyKeywords);

  useEffect(() => {
    // Supabaseからデータ取得（設定済みの場合のみ）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_')) return;

    fetch('/api/articles?limit=20')
      .then((r) => r.json())
      .then((data: Article[]) => { if (data.length > 0) setArticles(data); })
      .catch(() => {});

    fetch('/api/trending')
      .then((r) => r.json())
      .then((data: TrendingKeyword[]) => { if (data.length > 0) setKeywords(data); })
      .catch(() => {});
  }, []);

  const categoryFilter: Record<TabKey, string | null> = {
    top: null,
    news: null,
    tools: null,
    companies: 'AI企業',
    policy: '規制・政策',
    favorites: null,
  };

  const filtered = categoryFilter[activeTab]
    ? articles.filter((a) => a.category === categoryFilter[activeTab])
    : articles;

  const [hero, ...rest] = filtered;

  const latestLabel = lang === 'ko' ? '최신 뉴스' : lang === 'en' ? 'Latest News' : '最新ニュース';

  return (
    <div className="min-h-screen" style={{ background: '#0f0f1a' }}>
      <Navbar />
      <TickerBanner articles={articles} />
      <TabNav active={activeTab} onChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
          {hero && <HeroCard article={hero} />}
          <section className="rounded-2xl p-4" style={{ background: '#1a1a2e' }}>
            <h2 className="text-sm font-bold text-white mb-3">{latestLabel}</h2>
            {rest.length > 0 ? (
              rest.map((a) => <NewsCard key={a.id} article={a} lang={lang} />)
            ) : (
              <p className="text-sm text-white/40 py-4 text-center">記事がありません</p>
            )}
          </section>
        </div>

        <Sidebar tools={tools} keywords={keywords} />
      </main>
    </div>
  );
}
