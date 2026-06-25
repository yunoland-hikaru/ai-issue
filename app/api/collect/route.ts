import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { generateArticle } from '@/lib/claude';
import type { GeneratedArticle } from '@/lib/claude';
import { generateImage } from '@/lib/openai';
import { searchStockImage } from '@/lib/stock';
import { logoUrlForDomain } from '@/lib/logo';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/collect?source=0&limit=1
// source: 0=TechCrunch,1=VentureBeat,2=The Decoder,3=Synced,4=AI Business,5=InfoQ
// limit: max new articles per call (default 1, max 10)
//
// 【60秒制限への設計】Vercel Hobby は関数 60秒で打ち切り→504。
// Sonnet生成(~35s)＋Haiku翻訳(~25s)を直列で回すと 60秒を超えて 504 になり、
// しかも insert が最後だと記事ごと失われていた。そこで:
//   1) 翻訳は collect では行わない（ko/en は後追いの migrate-translations が埋める。
//      collect.yml では collect の直後に同 run でバックフィルを呼ぶので、新規記事は
//      数十秒以内に ko/en が付く）。これで直列チェーンから ~25秒を削減。
//   2) 生成できたら即 ja 記事を insert（画像より先）。画像が遅延/失敗しても記事は残り、
//      高価な Sonnet 呼び出しを無駄にしない。
//   3) 画像は insert 後の best-effort UPDATE（取りこぼしは migrate-images が補完）。
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

  // 直近記事で使ったストック写真IDを集めて重複画像を避ける（image_source_id列が無ければ無視）。
  const usedSourceIds: string[] = [];
  try {
    const { data: used } = await supabase
      .from('articles')
      .select('image_source_id')
      .not('image_source_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60);
    for (const r of (used as { image_source_id: string | null }[] | null) ?? []) {
      if (r.image_source_id) usedSourceIds.push(r.image_source_id);
    }
  } catch { /* 列未追加などは無視 */ }

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

    // ① ja 記事を先に保存（画像・翻訳より前）。これで以降の処理が遅延/失敗しても記事は残る。
    //    ko/en は null のまま → 後追いの migrate-translations（collect.yml で直後に同 run 実行）が埋める。
    const { data: inserted, error: insertError } = await supabase.from('articles').insert({
      title_ja: generated.title_ja || item.title,
      content_ja: generated.content_ja,
      summary_ja: generated.summary_ja || null,
      category: generated.category,
      source_url: item.url,
      source_name: item.sourceName,
      thumbnail_url: item.thumbnailUrl,
      image_url: null,
      logo_url: logoUrlForDomain(generated.company_domain),
      video_url: generated.video_url ?? null,
      hashtags_ja: generated.hashtags_ja?.length ? generated.hashtags_ja : null,
      published_at: item.publishedAt,
    }).select('id').single();

    if (insertError || !inserted?.id) {
      results.errors.push(`DB insert failed: ${item.url} — ${insertError?.message ?? 'no id'}`);
      continue;
    }
    results.collected++;
    const articleId = inserted.id as string;

    // ② 画像（best-effort）: ① 無料ストック(Pexels)を優先 → ② 無ければgpt-image-1で生成。
    //    どちらもライセンス上問題なし。RSS元画像（第三者著作物）は使わない。
    //    ここで失敗しても記事(ja)は既に保存済み。画像は image_url=null として残り migrate-images が補完。
    try {
      let imageBuffer: Buffer | null = null;
      let stockSourceId: string | null = null;
      let contentType = 'image/png';
      let ext = 'png';

      if (generated.image_keywords) {
        const stock = await searchStockImage(generated.image_keywords, usedSourceIds);
        if (stock) {
          imageBuffer = stock.buffer;
          stockSourceId = stock.sourceId;
          contentType = 'image/jpeg';
          ext = 'jpg';
        }
      }
      if (!imageBuffer && generated.image_prompt) {
        imageBuffer = await generateImage(generated.image_prompt);
      }

      if (imageBuffer) {
        let imageUrl: string | null = null;
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

        if (imageUrl) {
          // 画像URL（＋使ったストック写真ID）を記事に反映。image_source_id 列が無ければ image_url のみ更新。
          if (stockSourceId) usedSourceIds.unshift(stockSourceId);
          const update: Record<string, unknown> = { image_url: imageUrl };
          if (stockSourceId) update.image_source_id = stockSourceId;
          let { error: updErr } = await supabase.from('articles').update(update).eq('id', articleId);
          if (updErr && stockSourceId) {
            // image_source_id 列が未追加などの場合は image_url だけで再試行。
            ({ error: updErr } = await supabase.from('articles').update({ image_url: imageUrl }).eq('id', articleId));
          }
          if (updErr) results.errors.push(`Image url update failed: ${item.title} — ${updErr.message}`);
        }
      } else if (generated.image_keywords || generated.image_prompt) {
        results.errors.push(`Image unavailable (stock + AI both failed): ${item.title}`);
      }
    } catch (e) {
      results.errors.push(`Image step failed: ${item.title} — ${String(e)}`);
    }
  }

  // 新規記事が入ったら3ロケールのホーム(ISR revalidate=600)を即無効化。
  // これをしないと新着が最大10分・ロケール別にバラついて反映される（F5で出ない/言語切替で出たり消えたり）。
  // 再生成は新着が出た時だけ＝1日 ~10本×3 ≈ 30回/月900回で無料枠に対し無視できる。
  if (results.collected > 0) {
    try {
      for (const l of ['ja', 'ko', 'en']) revalidatePath(`/${l}`);
    } catch (e) {
      results.errors.push(`Revalidate failed: ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
