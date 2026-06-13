import { NextRequest, NextResponse } from 'next/server';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { generateArticle } from '@/lib/claude';
import { generateImage } from '@/lib/openai';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/collect?source=0&limit=1
// source: 0=AI Times, 1=TechCrunch, 2=VentureBeat, 3=The Verge
// limit: max new articles per call (default 1, max 10)
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceIndex = parseInt(searchParams.get('source') ?? '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '1', 10), 10);

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
      image_prompt: string | null;
      video_url: string | null;
      category: string;
    };
    try {
      generated = await generateArticle(item.title, item.content, item.thumbnailUrl);
    } catch (e) {
      results.errors.push(`Generate failed: ${item.title} — ${String(e)}`);
      continue;
    }

    // DALL-E 3で画像生成 → Supabase Storageに永続保存
    let imageUrl: string | null = item.thumbnailUrl ?? null;
    if (generated.image_prompt) {
      const imageBuffer = await generateImage(generated.image_prompt);
      if (imageBuffer) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, imageBuffer, { contentType: 'image/png', upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('article-images')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        } else {
          results.errors.push(`Storage upload failed: ${uploadError.message}`);
        }
      }
    }

    const { error } = await supabase.from('articles').insert({
      title_ja: generated.title_ja || item.title,
      title_en: item.title,
      content_ja: generated.content_ja,
      category: generated.category,
      source_url: item.url,
      source_name: item.sourceName,
      thumbnail_url: item.thumbnailUrl,
      image_url: imageUrl,
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
