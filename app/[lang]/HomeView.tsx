'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TabNav from '@/components/TabNav';
import HeroCard from '@/components/HeroCard';
import NewsCard from '@/components/NewsCard';
import Sidebar from '@/components/Sidebar';
import { HOME_RESET_EVENT } from '@/components/Logo';
import type { Article, Language } from '@/types';

type TabKey = 'top' | 'industry' | 'tech' | 'policy';

// 記事データはサーバー(page.tsx)から initialArticles/initialPopular で受け取り初期HTMLに含める（SEO）。
// タブ切替は取得済みの記事をクライアントで絞り込むだけ。
export default function HomeView({
  lang,
  initialArticles,
  initialPopular,
}: {
  lang: Language;
  initialArticles: Article[];
  initialPopular: Article[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('top');
  // 「最新ニュース」リストの表示件数。10件ずつ「もっと見る」で増やす。
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const articles = initialArticles;
  const popular = initialPopular;

  // タブ切替時は表示件数を初期(10)に戻す。
  function changeTab(tab: TabKey) {
    setActiveTab(tab);
    setVisibleCount(PAGE_SIZE);
  }

  // ロゴクリックでホームに既にいる場合、タブを全て(top)・表示件数を初期に戻しスクロールも最上部へ。
  useEffect(() => {
    function reset() {
      setActiveTab('top');
      setVisibleCount(PAGE_SIZE);
      window.scrollTo({ top: 0 });
    }
    window.addEventListener(HOME_RESET_EVENT, reset);
    return () => window.removeEventListener(HOME_RESET_EVENT, reset);
  }, []);

  const categoryFilter: Record<TabKey, string | null> = {
    top: null,
    industry: 'AI産業',
    tech: 'AI技術',
    policy: '規制・政策',
  };

  const filtered = categoryFilter[activeTab]
    ? articles.filter((a) => a.category === categoryFilter[activeTab])
    : articles;

  const [hero, ...rest] = filtered;
  const isEmpty = articles.length === 0;

  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;

  const latestLabel = lang === 'ko' ? '최신 뉴스' : lang === 'en' ? 'Latest News' : '最新ニュース';
  const moreLabel = lang === 'ko' ? '더보기' : lang === 'en' ? 'Show more' : 'もっと見る';
  const preparing =
    lang === 'ko'
      ? { title: '준비 중입니다', desc: '기사를 준비하고 있습니다. 잠시만 기다려 주세요.' }
      : lang === 'en'
        ? { title: 'Coming soon', desc: 'Articles are being prepared. Please check back shortly.' }
        : { title: 'ただいま準備中です', desc: '記事を準備しています。今しばらくお待ちください。' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <TabNav active={activeTab} onChange={changeTab} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col lg:flex-row gap-5">
        {isEmpty ? (
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
                <h2 className="text-base font-extrabold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>{latestLabel}</h2>
                {rest.length > 0 ? (
                  <>
                    {visibleRest.map((a) => <NewsCard key={a.id} article={a} lang={lang} />)}
                    {hasMore && (
                      <button
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                        style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-skeleton)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--input-bg)'; }}
                      >
                        {moreLabel}
                      </button>
                    )}
                  </>
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
