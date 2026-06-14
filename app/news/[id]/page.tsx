'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { CATEGORY_STYLES } from '@/lib/categoryStyles';
import { formatRelativeTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
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

      // 閲覧数を+1（MOST POPULARランキング用、失敗は無視）
      fetch('/api/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});

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
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];
  const title = (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  const content = (lang === 'ko' ? article.content_ko : lang === 'en' ? article.content_en : null) ?? article.content_ja;
  const heroImage = article.image_url ?? null;   // 上部ヒーロー: ストック/AI画像
  const logo = article.logo_url ?? null;          // タイトル横バッジ: 企業ロゴ
  const company = companyNameFromLogoUrl(article.logo_url);
  const ytId = article.video_url ? extractYouTubeId(article.video_url) : null;


  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Header — トップと同一（Navbar） */}
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Category + company badge + date */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: style.bg, color: style.text }}
          >
            {article.category}
          </span>
          {logo && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" className="h-4 w-4 rounded-sm object-contain" />
              {company}
            </span>
          )}
          <span className="text-sm" style={{ color: 'var(--text-4)' }}>{formatRelativeTime(article.created_at)}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-6" style={{ color: 'var(--text-1)' }}>{title}</h1>

        {/* Hero image (top) — stock / AI photo */}
        {heroImage && (
          <div className="rounded-2xl overflow-hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="w-full h-auto" />
          </div>
        )}

        {/* Article body */}
        {content && (
          <div
            className="leading-relaxed text-base sm:text-lg space-y-4 mb-8"
            style={{ color: 'var(--text-2)' }}
            dangerouslySetInnerHTML={{ __html: content }}
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
            <h2 className="text-base font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>関連記事</h2>
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
                          className="inline-block text-sm font-semibold px-2 py-0.5 rounded-full mb-1"
                          style={{ background: relStyle.bg, color: relStyle.text }}
                        >
                          {rel.category}
                        </span>
                        <p className="text-sm sm:text-base font-medium line-clamp-2 leading-snug" style={{ color: 'var(--text-2)' }}>
                          {relTitle}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>{formatRelativeTime(rel.created_at)}</p>
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
