import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { generateArticle } from '@/lib/claude';
import { generateImage } from '@/lib/openai';
import { searchStockImage } from '@/lib/stock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// image_url が null の既存記事に、collectと同じ Pexels→AI 画像パイプラインで画像だけ後追い保存する。
// 本文・翻訳・ロゴ等は変更しない（画像のみ補完）。POST /api/migrate-images?limit=1..10
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '5', 10), 1), 10);

  const supabase = getServiceClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja')
    .is('image_url', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length === 0) return NextResponse.json({ updated: 0, message: '対象記事なし（image_url=null は0件）' });

  const results = { updated: 0, errors: [] as string[] };

  for (const article of articles) {
    try {
      // 画像キーワード/プロンプトを得るためにgenerateArticleを使う（本文等は破棄、画像のみ利用）。
      const generated = await generateArticle(article.title_ja, article.summary_ja ?? article.title_ja);

      let imageBuffer: Buffer | null = null;
      let contentType = 'image/png';
      let ext = 'png';

      if (generated.image_keywords) {
        const stock = await searchStockImage(generated.image_keywords);
        if (stock) { imageBuffer = stock; contentType = 'image/jpeg'; ext = 'jpg'; }
      }
      if (!imageBuffer && generated.image_prompt) {
        imageBuffer = await generateImage(generated.image_prompt);
      }

      if (!imageBuffer) {
        results.errors.push(`Image unavailable (stock + AI both failed): ${article.id}`);
        continue;
      }

      // 一時的な失敗に備えて最大2回リトライ。
      let imageUrl: string | null = null;
      for (let attempt = 1; attempt <= 2 && !imageUrl; attempt++) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, imageBuffer, { contentType, upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        } else if (attempt === 2) {
          results.errors.push(`Storage upload failed (x2): ${article.id} — ${uploadError.message}`);
        }
      }

      if (!imageUrl) continue;

      const { error: updateError } = await supabase
        .from('articles')
        .update({ image_url: imageUrl })
        .eq('id', article.id);

      if (updateError) results.errors.push(`Update failed: ${article.id} — ${updateError.message}`);
      else results.updated++;
    } catch (e) {
      results.errors.push(`Failed: ${article.id} — ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
