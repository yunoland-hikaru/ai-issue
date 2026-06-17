import { NextRequest, NextResponse } from 'next/server';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { generateArticle, translateArticle } from '@/lib/claude';
import type { GeneratedArticle, ArticleTranslation } from '@/lib/claude';
import { generateImage } from '@/lib/openai';
import { searchStockImage } from '@/lib/stock';
import { logoUrlForDomain } from '@/lib/logo';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/collect?source=0&limit=1
// source: 0=TechCrunch, 1=VentureBeat, 2=The Verge
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

    let generated: GeneratedArticle;
    try {
      generated = await generateArticle(item.title, item.content);
    } catch (e) {
      results.errors.push(`Generate failed: ${item.title} — ${String(e)}`);
      continue;
    }

    // 韓国語・英語へ翻訳（タイトル・要約・本文）。失敗しても日本語記事は保存する。
    let translation: ArticleTranslation | null = null;
    try {
      translation = await translateArticle(
        generated.title_ja || item.title,
        generated.summary_ja,
        generated.content_ja,
        generated.hashtags_ja,
      );
    } catch (e) {
      results.errors.push(`Translate failed: ${item.title} — ${String(e)}`);
    }

    // 画像: ① 無料ストック(Pexels)を優先 → ② 無ければgpt-image-1で生成
    // どちらもライセンス上問題なし。RSS元画像（第三者著作物）は使わない。
    let imageUrl: string | null = null;
    let imageBuffer: Buffer | null = null;
    let contentType = 'image/png';
    let ext = 'png';

    if (generated.image_keywords) {
      const stock = await searchStockImage(generated.image_keywords);
      if (stock) {
        imageBuffer = stock;
        contentType = 'image/jpeg';
        ext = 'jpg';
      }
    }
    if (!imageBuffer && generated.image_prompt) {
      imageBuffer = await generateImage(generated.image_prompt);
    }

    if (imageBuffer) {
      // 一時的な Bad Request 等に備えて最大2回リトライ（毎回ファイル名を変える）。
      for (let attempt = 1; attempt <= 2 && !imageUrl; attempt++) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, imageBuffer, { contentType, upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        } else if (attempt === 2) {
          results.errors.push(`Storage upload failed (x2): ${uploadError.message} (${imageBuffer.length}B, ${contentType})`);
        }
      }
    } else if (generated.image_keywords || generated.image_prompt) {
      results.errors.push(`Image unavailable (stock + AI both failed): ${item.title}`);
    }

    const { error } = await supabase.from('articles').insert({
      title_ja: generated.title_ja || item.title,
      title_ko: translation?.title_ko || null,
      title_en: translation?.title_en || null,
      content_ja: generated.content_ja,
      content_ko: translation?.content_ko || null,
      content_en: translation?.content_en || null,
      summary_ja: generated.summary_ja || null,
      summary_ko: translation?.summary_ko || null,
      summary_en: translation?.summary_en || null,
      category: generated.category,
      source_url: item.url,
      source_name: item.sourceName,
      thumbnail_url: item.thumbnailUrl,
      image_url: imageUrl,
      logo_url: logoUrlForDomain(generated.company_domain),
      video_url: generated.video_url ?? null,
      hashtags_ja: generated.hashtags_ja?.length ? generated.hashtags_ja : null,
      hashtags_ko: translation?.hashtags_ko?.length ? translation.hashtags_ko : null,
      hashtags_en: translation?.hashtags_en?.length ? translation.hashtags_en : null,
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
