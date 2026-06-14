import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { generateArticle, translateArticle } from '@/lib/claude';
import { generateImage } from '@/lib/openai';
import { searchStockImage } from '@/lib/stock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// content_ja が未生成の既存記事を、collectと同じClaude + DALL-Eパイプラインで後追い生成する
export async function POST() {
  const supabase = getServiceClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja, thumbnail_url, image_url')
    .is('content_ja', null)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length === 0) return NextResponse.json({ updated: 0, message: '対象記事なし' });

  const results = { updated: 0, errors: [] as string[] };

  for (const article of articles) {
    try {
      // タイトル＋既存要約を原文として、本文・要約・画像プロンプト・カテゴリを生成
      const generated = await generateArticle(article.title_ja, article.summary_ja ?? article.title_ja);

      // 画像: 既存がなければ ① 無料ストック → ② AI生成 でSupabase Storageに永続保存
      let imageUrl: string | null = article.image_url ?? null;
      if (!article.image_url) {
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
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, imageBuffer, { contentType, upsert: false });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          } else {
            results.errors.push(`Storage upload failed: ${article.id} — ${uploadError.message}`);
          }
        }
      }

      // 韓国語・英語へ翻訳（失敗しても日本語本文は保存する）
      let translation = null;
      try {
        translation = await translateArticle(article.title_ja, generated.summary_ja, generated.content_ja);
      } catch (e) {
        results.errors.push(`Translate failed: ${article.id} — ${String(e)}`);
      }

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          content_ja: generated.content_ja,
          content_ko: translation?.content_ko || null,
          content_en: translation?.content_en || null,
          summary_ja: generated.summary_ja || article.summary_ja || null,
          summary_ko: translation?.summary_ko || null,
          summary_en: translation?.summary_en || null,
          title_ko: translation?.title_ko || null,
          title_en: translation?.title_en || null,
          image_url: imageUrl,
          video_url: generated.video_url ?? null,
        })
        .eq('id', article.id);

      if (updateError) {
        results.errors.push(`Update failed: ${article.id} — ${updateError.message}`);
      } else {
        results.updated++;
      }
    } catch (e) {
      results.errors.push(`Generate failed: ${article.title_ja} — ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
