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
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [tools, setTools] = useState<Tool[]>(dummyTools);
  const [keywords, setKeywords] = useState<TrendingKeyword[]>(dummyKeywords);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_')) {
      setArticles(dummyArticles);
      return;
    }

    fetch('/api/articles?limit=20')
      .then((r) => r.json())
      .then((data: Article[]) => setArticles(data.length > 0 ? data : dummyArticles))
      .catch(() => setArticles(dummyArticles));

    fetch('/api/trending')
      .then((r) => r.json())
      .then((data: TrendingKeyword[]) => { if (data.length > 0) setKeywords(data); })
      .catch(() => {});
  }, []);

  const isLoading = articles === null;
  const displayArticles = articles ?? [];

  const categoryFilter: Record<TabKey, string | null> = {
    top: null,
    news: null,
    tools: null,
    companies: 'AI企業',
    policy: '規制・政策',
    favorites: null,
  };

  const filtered = categoryFilter[activeTab]
    ? displayArticles.filter((a) => a.category === categoryFilter[activeTab])
    : displayArticles;

  const [hero, ...rest] = filtered;

  const latestLabel = lang === 'ko' ? '최신 뉴스' : lang === 'en' ? 'Latest News' : '最新ニュース';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <TickerBanner articles={displayArticles} />
      <TabNav active={activeTab} onChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col lg:flex-row gap-5">
        {isLoading ? (
          <>
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
              <div className="rounded-2xl h-52 sm:h-64 animate-pulse" style={{ background: 'var(--bg-card)' }} />
              <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--bg-card)' }}>
                <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--bg-skeleton)' }} />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="rounded-lg w-20 h-16 shrink-0 animate-pulse" style={{ background: 'var(--bg-skeleton)' }} />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 rounded animate-pulse" style={{ background: 'var(--bg-skeleton)' }} />
                      <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'var(--bg-skeleton)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Sidebar tools={tools} keywords={keywords} />
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
              {hero && <HeroCard article={hero} />}
              <section className="rounded-2xl p-4" style={{ background: 'var(--bg-card)' }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-1)' }}>{latestLabel}</h2>
                {rest.length > 0 ? (
                  rest.map((a) => <NewsCard key={a.id} article={a} lang={lang} />)
                ) : (
                  <p className="text-sm py-4 text-center" style={{ color: 'var(--text-4)' }}>記事がありません</p>
                )}
              </section>
            </div>
            <Sidebar tools={tools} keywords={keywords} />
          </>
        )}
      </main>
    </div>
  );
}
