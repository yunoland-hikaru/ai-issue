import { getClient } from '@/lib/supabase';
import type { Article } from '@/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// 外部の「RSS→X自動投稿」サービス(dlvr.it / Make / Zapier等)向けの英語フィード。
// X投稿は英語運用のため、英語タイトル・要約・/en/news リンクで出力。
export const dynamic = 'force-dynamic';

function cdata(s: string): string {
  return `<![CDATA[${(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function rfc822(dateStr: string): string {
  const norm = /Z$|[+-]\d{2}:?\d{2}$/.test((dateStr ?? '').trim()) ? dateStr : `${dateStr}Z`;
  const d = new Date(norm);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
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
      const url = `${SITE}/en/news/${a.id}`;
      // 英語ハッシュタグをタイトル末尾に付与 → dlvr.it がツイート本文(=title)に含める。最大4個。
      const tags = (a.hashtags_en ?? []).slice(0, 4).map((h) => `#${h}`).join(' ');
      const baseTitle = a.title_en || a.title_ja || '';
      const title = tags ? `${baseTitle} ${tags}` : baseTitle;
      const desc = a.summary_en || a.summary_ja || '';
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
    <link>${SITE}/en</link>
    <description>Daily AI news, made easy to read.</description>
    <language>en</language>
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
