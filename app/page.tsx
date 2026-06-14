'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TabNav from '@/components/TabNav';
import HeroCard from '@/components/HeroCard';
import NewsCard from '@/components/NewsCard';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/contexts/LangContext';
import type { Article } from '@/types';

type TabKey = 'top' | 'industry' | 'tech' | 'policy';

// ビルド時にインライン化される定数。Supabase未設定なら空状態（準備中）で起動する。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hasSupabase = !!supabaseUrl && !supabaseUrl.includes('your_');

export default function Home() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<TabKey>('top');
  const [articles, setArticles] = useState<Article[] | null>(hasSupabase ? null : []);
  const [popular, setPopular] = useState<Article[]>([]);

  useEffect(() => {
    if (!hasSupabase) return;

    fetch('/api/articles?limit=20')
      .then((r) => r.json())
      .then((data: Article[]) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));

    fetch('/api/articles?sort=popular&limit=10')
      .then((r) => r.json())
      .then((data: Article[]) => { if (Array.isArray(data)) setPopular(data); })
      .catch(() => {});
  }, []);

  const isLoading = articles === null;
  const displayArticles = articles ?? [];

  const categoryFilter: Record<TabKey, string | null> = {
    top: null,
    industry: 'AI産業',
    tech: 'AI技術',
    policy: '規制・政策',
  };

  const filtered = categoryFilter[activeTab]
    ? displayArticles.filter((a) => a.category === categoryFilter[activeTab])
    : displayArticles;

  const [hero, ...rest] = filtered;

  const isEmpty = !isLoading && displayArticles.length === 0;

  const latestLabel = lang === 'ko' ? '최신 뉴스' : lang === 'en' ? 'Latest News' : '最新ニュース';
  const preparing =
    lang === 'ko'
      ? { title: '준비 중입니다', desc: '기사를 준비하고 있습니다. 잠시만 기다려 주세요.' }
      : lang === 'en'
        ? { title: 'Coming soon', desc: 'Articles are being prepared. Please check back shortly.' }
        : { title: 'ただいま準備中です', desc: '記事を準備しています。今しばらくお待ちください。' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
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
            <Sidebar popular={popular} />
          </>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-24 sm:py-32">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--bg-card)' }}>
              <svg width="28" height="28" fill="none" stroke="var(--accent)" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>{preparing.title}</h2>
            <p className="text-base" style={{ color: 'var(--text-3)' }}>{preparing.desc}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
              {hero && <HeroCard article={hero} lang={lang} />}
              <section className="rounded-2xl p-4" style={{ background: 'var(--bg-card)' }}>
                <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-1)' }}>{latestLabel}</h2>
                {rest.length > 0 ? (
                  rest.map((a) => <NewsCard key={a.id} article={a} lang={lang} />)
                ) : (
                  <p className="text-base py-4 text-center" style={{ color: 'var(--text-4)' }}>記事がありません</p>
                )}
              </section>
            </div>
            <Sidebar popular={popular} />
          </>
        )}
      </main>
    </div>
  );
}
