'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LangContext';
import { CATEGORY_STYLES } from '@/lib/categoryStyles';
import { formatRelativeTime } from '@/lib/utils';
import { dummyArticles } from '@/lib/dummy';
import { getClient } from '@/lib/supabase';
import type { Article } from '@/types';

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { lang, t } = useLang();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    params.then(async ({ id }) => {
      // まずSupabaseで検索、なければダミーデータ
      try {
        const { data } = await getClient()
          .from('articles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data) { setArticle(data); return; }
      } catch { /* Supabase未設定 */ }

      const found = dummyArticles.find((a) => a.id === id) ?? dummyArticles[0];
      setArticle(found);
    });
  }, [params]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[#7F77DD] border-t-transparent animate-spin" />
      </div>
    );
  }

  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];
  const title = (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  const summary = (lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : null) ?? article.summary_ja;
  const aiSummaryLabel = lang === 'ko' ? 'AI 요약' : lang === 'en' ? 'AI Summary' : 'AI要約';

  return (
    <div className="min-h-screen" style={{ background: '#0f0f1a' }}>
      <header style={{ background: '#1a1a2e' }} className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-[#7F77DD] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t.article.backToTop}
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-lg font-bold" style={{ color: '#7F77DD' }}>AI issue</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {article.thumbnail_url && (
          <div className="rounded-2xl overflow-hidden mb-6 h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
          style={{ background: style.bg, color: style.text }}
        >
          {article.category}
        </span>

        <h1 className="text-2xl font-bold text-white leading-snug mb-4">{title}</h1>

        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <span>{article.source_name}</span>
          <span>·</span>
          <span>{formatRelativeTime(article.published_at)}</span>
        </div>

        {summary && (
          <div className="rounded-2xl p-5 mb-6 text-white/80 leading-relaxed" style={{ background: '#1a1a2e' }}>
            <p className="text-xs font-semibold text-[#7F77DD] mb-2">{aiSummaryLabel}</p>
            <p>{summary}</p>
          </div>
        )}

        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#7F77DD', color: '#fff' }}
        >
          {t.article.readOriginal}
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </main>
    </div>
  );
}
