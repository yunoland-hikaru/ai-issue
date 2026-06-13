import { NextRequest, NextResponse } from 'next/server';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { generateArticle } from '@/lib/claude';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/collect?source=0&limit=5
// source: 0=AI Times, 1=TechCrunch, 2=VentureBeat, 3=The Verge
// limit: max new articles to generate per call (default 5, max 10)
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceIndex = parseInt(searchParams.get('source') ?? '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 10);

  const source = RSS_SOURCES[sourceIndex];
  if (!source) {
    return NextResponse.json(
      {
        error: `Invalid source index. Use 0–${RSS_SOURCES.length - 1}`,
        sources: RSS_SOURCES.map((s, i) => ({ i, name: s.name })),
      },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const results = { source: source.name, collected: 0, skipped: 0, errors: [] as string[] };

  let items;
  try {
    items = await fetchRssFeed(source);
  } catch (e) {
    return NextResponse.json({ error: `RSS fetch failed: ${String(e)}` }, { status: 500 });
  }

  for (const item of items) {
    if (results.collected >= limit) break;

    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('source_url', item.url)
      .maybeSingle();

    if (existing) { results.skipped++; continue; }

    let generated: {
      title_ja: string;
      content_ja: string;
      image_url: string | null;
      video_url: string | null;
      category: string;
    };
    try {
      generated = await generateArticle(item.title, item.content, item.thumbnailUrl);
    } catch (e) {
      results.errors.push(`Generate failed: ${item.title} — ${String(e)}`);
      continue;
    }

    const { error } = await supabase.from('articles').insert({
      title_ja: generated.title_ja || item.title,
      title_en: item.title,
      content_ja: generated.content_ja,
      category: generated.category,
      source_url: item.url,
      source_name: item.sourceName,
      thumbnail_url: item.thumbnailUrl,
      image_url: generated.image_url ?? item.thumbnailUrl ?? null,
      video_url: generated.video_url ?? null,
      published_at: item.publishedAt,
    });

    if (error) {
      results.errors.push(`DB insert failed: ${item.url} — ${error.message}`);
    } else {
      results.collected++;
    }
  }

  return NextResponse.json(results);
}
