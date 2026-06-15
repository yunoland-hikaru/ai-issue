import { getClient } from '@/lib/supabase';
import { isLocale } from '@/lib/i18n';
import type { Article, Language } from '@/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// 外部の「RSS→SNS自動投稿」サービス(dlvr.it / Make / Zapier等)向けフィード。
// 言語は ?lang=ja|ko|en で指定（既定 en）。X=英語、Threads=別言語…など用途別に使い分け可能。
// タイトル末尾にハッシュタグを付与 → dlvr.it等が投稿本文(=title)に含める。
export const dynamic = 'force-dynamic';

function cdata(s: string): string {
  return `<![CDATA[${(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function rfc822(dateStr: string): string {
  const norm = /Z$|[+-]\d{2}:?\d{2}$/.test((dateStr ?? '').trim()) ? dateStr : `${dateStr}Z`;
  const d = new Date(norm);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

function pick(a: Article, lang: Language, field: 'title' | 'summary'): string {
  if (field === 'title') {
    return ((lang === 'ko' ? a.title_ko : lang === 'en' ? a.title_en : null) ?? a.title_ja) || '';
  }
  return ((lang === 'ko' ? a.summary_ko : lang === 'en' ? a.summary_en : null) ?? a.summary_ja) || '';
}

function tagsOf(a: Article, lang: Language): string[] {
  return (lang === 'ko' ? a.hashtags_ko : lang === 'en' ? a.hashtags_en : null) ?? a.hashtags_ja ?? [];
}

const CHANNEL_DESC: Record<Language, string> = {
  ja: 'AI関連ニュースを毎日わかりやすく。',
  ko: 'AI 관련 뉴스를 매일 알기 쉽게.',
  en: 'Daily AI news, made easy to read.',
};

export async function GET(req: Request) {
  const langParam = new URL(req.url).searchParams.get('lang');
  const lang: Language = isLocale(langParam) ? langParam : 'en';

  let articles: Article[] = [];
  try {
    const { data } = await getClient()
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    articles = (data as Article[]) ?? [];
  } catch { /* Supabase未設定/失敗時は空フィード */ }

  const items = articles
    .map((a) => {
      const url = `${SITE}/${lang}/news/${a.id}`;
      const tags = tagsOf(a, lang).slice(0, 4).map((h) => `#${h}`).join(' ');
      const baseTitle = pick(a, lang, 'title');
      const title = tags ? `${baseTitle} ${tags}` : baseTitle;
      const desc = pick(a, lang, 'summary');
      const img = a.image_url
        ? `<enclosure url="${a.image_url.replace(/&/g, '&amp;')}" type="image/jpeg" />`
        : '';
      return `    <item>
      <title>${cdata(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(a.created_at)}</pubDate>
      <description>${cdata(desc)}</description>
      ${img}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI issue</title>
    <link>${SITE}/${lang}</link>
    <description>${cdata(CHANNEL_DESC[lang])}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=600, stale-while-revalidate=600',
    },
  });
}
