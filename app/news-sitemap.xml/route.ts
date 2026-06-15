import { getClient } from '@/lib/supabase';
import type { Article } from '@/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// Google News 用サイトマップ。直近48時間の記事のみ（News仕様）。日本語URLを基準に出力。
export const dynamic = 'force-dynamic';

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function iso(dateStr: string): string {
  const norm = /Z$|[+-]\d{2}:?\d{2}$/.test((dateStr ?? '').trim()) ? dateStr : `${dateStr}Z`;
  const d = new Date(norm);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function GET() {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  let articles: Article[] = [];
  try {
    const { data } = await getClient()
      .from('articles')
      .select('id, title_ja, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);
    articles = (data as Article[]) ?? [];
  } catch { /* Supabase未設定/失敗時は空 */ }

  const urls = articles
    .map(
      (a) => `  <url>
    <loc>${SITE}/ja/news/${a.id}</loc>
    <news:news>
      <news:publication>
        <news:name>AI issue</news:name>
        <news:language>ja</news:language>
      </news:publication>
      <news:publication_date>${iso(a.created_at)}</news:publication_date>
      <news:title>${esc(a.title_ja || '')}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=600, stale-while-revalidate=600',
    },
  });
}
