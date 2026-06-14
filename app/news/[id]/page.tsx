'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LangContext';
import { CATEGORY_STYLES } from '@/lib/categoryStyles';
import { formatRelativeTime } from '@/lib/utils';
import { dummyArticles } from '@/lib/dummy';
import { getClient } from '@/lib/supabase';
import type { Article } from '@/types';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}


export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { lang } = useLang();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);

  useEffect(() => {
    params.then(async ({ id }) => {
      let found: Article | null = null;

      try {
        const { data } = await getClient()
          .from('articles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data) found = data;
      } catch { /* Supabase未設定 */ }

      if (!found) {
        found = dummyArticles.find((a) => a.id === id) ?? dummyArticles[0];
      }
      setArticle(found);

      if (found) {
        try {
          const { data: rel } = await getClient()
            .from('articles')
            .select('*')
            .eq('category', found.category)
            .neq('id', found.id)
            .order('created_at', { ascending: false })
            .limit(3);
          if (rel && rel.length > 0) {
            setRelated(rel);
          } else {
            setRelated(dummyArticles.filter((a) => a.category === found!.category && a.id !== found!.id).slice(0, 3));
          }
        } catch {
          setRelated(dummyArticles.filter((a) => a.category === found!.category && a.id !== found!.id).slice(0, 3));
        }
      }
    });
  }, [params]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[#7F77DD] border-t-transparent animate-spin" />
      </div>
    );
  }

  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];
  const title = (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  const content = (lang === 'ko' ? article.content_ko : lang === 'en' ? article.content_en : null) ?? article.content_ja;
  const heroImage = article.image_url ?? null;   // 上部ヒーロー: ストック/AI画像
  const logo = article.logo_url ?? null;          // 本文中央: 企業ロゴ
  const ytId = article.video_url ? extractYouTubeId(article.video_url) : null;

  // Split content at paragraph boundaries to inject the logo in the middle
  const contentParts = content ? content.split(/(?<=<\/p>)(?=<p>)/) : [];
  const mid = Math.ceil(contentParts.length / 2);
  const firstHalf = contentParts.slice(0, mid).join('');
  const secondHalf = contentParts.slice(mid).join('');


  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-nav)', borderColor: 'var(--border-1)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm hover:text-[#7F77DD] transition-colors"
            style={{ color: 'var(--text-3)' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
            トップへ戻る
          </Link>
          <span style={{ color: 'var(--border-1)' }}>·</span>
          <span className="text-base font-bold" style={{ color: '#7F77DD' }}>AI issue</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Category + date */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: style.bg, color: style.text }}
          >
            {article.category}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-4)' }}>{formatRelativeTime(article.created_at)}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-6" style={{ color: 'var(--text-1)' }}>{title}</h1>

        {/* Hero image (top) — stock / AI photo */}
        {heroImage && (
          <div className="rounded-2xl overflow-hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="w-full h-auto" />
          </div>
        )}

        {/* Article body — company logo injected after middle paragraph */}
        {firstHalf && (
          <div
            className="leading-relaxed text-sm sm:text-base space-y-4"
            style={{ color: 'var(--text-2)' }}
            dangerouslySetInnerHTML={{ __html: firstHalf }}
          />
        )}
        {logo && (
          <div className="my-6 flex justify-center">
            <div
              className="rounded-2xl px-12 py-8 flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-1)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
            </div>
          </div>
        )}
        {secondHalf && (
          <div
            className="leading-relaxed text-sm sm:text-base space-y-4 mb-8"
            style={{ color: 'var(--text-2)' }}
            dangerouslySetInnerHTML={{ __html: secondHalf }}
          />
        )}

        {/* Video embed */}
        {ytId && (
          <div className="mb-8">
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}`}
                title="関連動画"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>関連記事</h2>
            <div className="space-y-3">
              {related.map((rel) => {
                const relStyle = CATEGORY_STYLES[rel.category] ?? CATEGORY_STYLES['AI産業'];
                const relTitle = (lang === 'ko' ? rel.title_ko : lang === 'en' ? rel.title_en : null) ?? rel.title_ja;
                return (
                  <Link key={rel.id} href={`/news/${rel.id}`}>
                    <article
                      className="flex gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--input-bg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {rel.image_url && (
                        <div className="shrink-0 w-16 h-14 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={rel.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
                          style={{ background: relStyle.bg, color: relStyle.text }}
                        >
                          {rel.category}
                        </span>
                        <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-snug" style={{ color: 'var(--text-2)' }}>
                          {relTitle}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{formatRelativeTime(rel.created_at)}</p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
