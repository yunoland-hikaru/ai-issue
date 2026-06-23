'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { CATEGORY_STYLES, categoryLabel } from '@/lib/categoryStyles';
import { formatDateTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
import { getClient } from '@/lib/supabase';
import { localePath } from '@/lib/i18n';
import { trackEvent } from '@/lib/gtag';
import ArticleComments from './ArticleComments';
import type { Article } from '@/types';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// 記事本文は親(サーバーコンポーネント)から initialArticle で受け取り、初期HTMLに含める（SEO）。
// 言語切替・閲覧数+1・関連記事の取得はクライアントで行う。
export default function ArticleView({ initialArticle }: { initialArticle: Article }) {
  const { lang } = useLang();
  const article = initialArticle;
  const [related, setRelated] = useState<Article[]>([]);
  const [shared, setShared] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 精読計測: 本文を75%までスクロールしたら一度だけ article_read を送る（GA Key event候補）。
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const rect = el.getBoundingClientRect();
      // 本文上端からの読了率 =（画面下端 − 本文上端）/ 本文高さ
      const read = rect.height > 0 ? (window.innerHeight - rect.top) / rect.height : 0;
      if (read >= 0.75) {
        fired = true;
        trackEvent('article_read', { article_id: article.id, percent: 75 });
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 画面に収まる短い記事も拾う
    return () => window.removeEventListener('scroll', onScroll);
  }, [article.id]);

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

  // シェア: Web Share API があればネイティブ共有、無ければURLをクリップボードへコピー。
  // 完了時のみ share イベントを送る（キャンセルは計測しない）。
  const shareLabel = lang === 'ko' ? '공유' : lang === 'en' ? 'Share' : 'シェア';
  const sharedLabel = lang === 'ko' ? '복사됨' : lang === 'en' ? 'Copied' : 'コピーしました';
  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        trackEvent('share', { method: 'web_share', article_id: article.id });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        trackEvent('share', { method: 'clipboard', article_id: article.id });
        setTimeout(() => setShared(false), 2000);
      }
    } catch { /* ユーザーがキャンセル / 権限拒否 */ }
  }

  // 作成者バイライン + 著作権の主張（自社で事実から独自作成した独立著作物）。
  const author = lang === 'ko' ? 'AI issue 편집부' : lang === 'en' ? 'AI issue Staff' : 'AI issue 編集部';
  const creditNote =
    lang === 'ko'
      ? '본 기사는 AI issue 편집부가 사실(fact)을 바탕으로 독자적으로 작성·편집한 저작물입니다. 저작권은 AI issue에 있으며, 무단 전재·재배포 및 AI 학습·활용을 금합니다.'
      : lang === 'en'
        ? 'This article is an original work independently written and edited by the AI issue editorial team based on factual reporting. © AI issue. Unauthorized reproduction, redistribution, or use for AI training is prohibited.'
        : '本記事は、AI issue編集部が事実(ファクト)をもとに独自に作成・編集した著作物です。著作権はAI issueに帰属し、無断転載・再配布およびAIの学習・活用を禁じます。';

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
          <button
            type="button"
            onClick={handleShare}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full transition-colors hover:text-[var(--accent)]"
            style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}
            aria-label={shareLabel}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {shared ? sharedLabel : shareLabel}
          </button>
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
            ref={bodyRef}
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

        {/* Author byline（出典行と同じ控えめなトーン） */}
        <div className="mt-8 text-sm" style={{ color: 'var(--text-3)' }}>
          <Link
            href={localePath(lang, '/editorial')}
            className="font-medium transition-colors hover:text-[var(--accent)]"
            style={{ color: 'var(--text-2)' }}
          >
            {author}
          </Link>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-4)' }}>{creditNote}</p>
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
