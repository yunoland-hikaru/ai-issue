'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { CATEGORY_STYLES, categoryLabel } from '@/lib/categoryStyles';
import { formatDateTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
import { getClient } from '@/lib/supabase';
import { localePath } from '@/lib/i18n';
import ArticleComments from './ArticleComments';
import type { Article } from '@/types';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// 記事本文は親(サーバーコンポーネント)から initialArticle で受け取り、初期HTMLに含める（SEO）。
// 言語切替・閲覧数+1・関連記事の取得はクライアントで行う。
export default function ArticleView({ initialArticle }: { initialArticle: Article }) {
  const { lang, t } = useLang();
  const article = initialArticle;
  const [related, setRelated] = useState<Article[]>([]);

  useEffect(() => {
    const id = article.id;

    // 閲覧数を+1（MOST POPULARランキング用、失敗は無視）
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});

    // 同カテゴリの実記事のみ。無ければ関連記事セクションは出さない（ダミーは使わない）
    (async () => {
      try {
        const { data: rel } = await getClient()
          .from('articles')
          .select('*')
          .eq('category', article.category)
          .neq('id', id)
          .order('created_at', { ascending: false })
          .limit(3);
        setRelated(rel ?? []);
      } catch {
        setRelated([]);
      }
    })();
  }, [article.id, article.category]);

  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];
  const title = (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  const content = (lang === 'ko' ? article.content_ko : lang === 'en' ? article.content_en : null) ?? article.content_ja;
  const summary = (lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : null) ?? article.summary_ja;
  const hashtags = ((lang === 'ko' ? article.hashtags_ko : lang === 'en' ? article.hashtags_en : null) ?? article.hashtags_ja) ?? [];
  const heroImage = article.image_url ?? null;   // 上部ヒーロー: ストック/AI画像
  const logo = article.logo_url ?? null;          // タイトル横バッジ: 企業ロゴ
  const company = companyNameFromLogoUrl(article.logo_url);
  const ytId = article.video_url ? extractYouTubeId(article.video_url) : null;

  // 作成者バイライン + AI作成の透明性表示（E-E-A-T / Google News向け）。
  const author = lang === 'ko' ? 'AI issue 편집부' : lang === 'en' ? 'AI issue Staff' : 'AI issue 編集部';
  const creditNote =
    lang === 'ko'
      ? 'AI가 공개된 정보를 수집·요약·재구성해 작성합니다. 중요한 내용은 원문 출처를 확인해 주세요.'
      : lang === 'en'
        ? 'Written by AI from publicly available sources (collected, summarized, and restructured). Please verify key details with the original source.'
        : 'AIが公開情報を収集・要約・再構成して作成しています。重要な内容は元の情報源をご確認ください。';

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
            {categoryLabel(article.category, lang)}
          </span>
          {logo && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" className="h-4 w-4 rounded-sm object-contain" />
              {company}
            </span>
          )}
          <span className="text-sm" style={{ color: 'var(--text-4)' }}>{formatDateTime(article.created_at, lang)}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-5" style={{ color: 'var(--text-1)' }}>{title}</h1>

        {/* Lead / summary — ホームのカードと同じ要約をリード文として表示 */}
        {summary && (
          <p
            className="text-base sm:text-lg leading-relaxed mb-6 pl-4"
            style={{ color: 'var(--text-2)', borderLeft: '3px solid var(--accent)' }}
          >
            {summary}
          </p>
        )}

        {/* Hero image (top) — stock / AI photo。16:9にクロップしてLCP最適化 */}
        {heroImage && (
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6">
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
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

        {/* Hashtags（記事の重要キーワード） */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {hashtags.map((h) => (
              <span
                key={h}
                className="text-sm px-3 py-1 rounded-full"
                style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}
              >
                #{h}
              </span>
            ))}
          </div>
        )}

        {/* Author byline + AI作成の透明性表示 */}
        <div className="flex items-start gap-3 mb-8 p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <span
            className="shrink-0 inline-flex items-center justify-center"
            aria-hidden
          >
            <svg viewBox="0 0 100 100" width="36" height="36">
              <circle cx="50" cy="50" r="50" fill="var(--text-1)" />
              <polygon points="50,27 73,69 27,69" fill="var(--bg-card)" />
            </svg>
          </span>
          <div className="min-w-0">
            <Link
              href={localePath(lang, '/editorial')}
              className="text-sm font-semibold transition-colors hover:text-[var(--accent)]"
              style={{ color: 'var(--text-1)' }}
            >
              {author}
            </Link>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-4)' }}>{creditNote}</p>
          </div>
        </div>

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

        {/* Source attribution — 原文へのリンク（出典明示） */}
        {article.source_url && (
          <div
            className="mt-8 pt-5 text-sm flex flex-wrap items-center gap-x-1.5 gap-y-1"
            style={{ borderTop: '1px solid var(--border-1)', color: 'var(--text-3)' }}
          >
            <span>{t.article.source}:</span>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium transition-colors hover:text-[var(--accent)]"
              style={{ color: 'var(--text-2)' }}
            >
              {article.source_name || article.source_url}
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
            <span>·</span>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              {t.article.readOriginal}
            </a>
          </div>
        )}

        {/* Comments */}
        <ArticleComments articleId={article.id} />

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>関連記事</h2>
            <div className="space-y-3">
              {related.map((rel) => {
                const relStyle = CATEGORY_STYLES[rel.category] ?? CATEGORY_STYLES['AI産業'];
                const relTitle = (lang === 'ko' ? rel.title_ko : lang === 'en' ? rel.title_en : null) ?? rel.title_ja;
                return (
                  <Link key={rel.id} href={localePath(lang, `/news/${rel.id}`)}>
                    <article
                      className="flex gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--input-bg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {rel.image_url && (
                        <div className="relative shrink-0 w-16 h-14 rounded-lg overflow-hidden">
                          <Image src={rel.image_url} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-block text-sm font-semibold px-2 py-0.5 rounded-full mb-1"
                          style={{ background: relStyle.bg, color: relStyle.text }}
                        >
                          {categoryLabel(rel.category, lang)}
                        </span>
                        <p className="text-sm sm:text-base font-medium line-clamp-2 leading-snug" style={{ color: 'var(--text-2)' }}>
                          {relTitle}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-4)' }}>{formatDateTime(rel.created_at, lang)}</p>
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
