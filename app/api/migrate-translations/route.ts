import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase';
import { translateArticle, hasJpResidue } from '@/lib/claude';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 韓国語/英語訳に日本語の文字（かな・漢字）が残ってしまった既存記事を探し、
// 日本語の原文(ja)から ko/en を再翻訳して上書きする。本文(ja)・画像・ロゴ等は変更しない。
// 訳し漏れ（例: 韓国語タイトルに「研究」「開発」が残る → モバイルで横スクロール）の後追い修正用。
// POST /api/migrate-translations?limit=1..20
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '5', 10), 1), 20);

  const supabase = getServiceClient();

  // 翻訳済み（content_ko あり）の新しめの記事を広めに取得し、JS側で訳し漏れを判定する。
  // （Supabaseクエリで日本語混入を直接フィルタできないため、候補を取得してから絞り込む）
  // 原文(content_ja)がある記事を広めに取得。ko/en の欠落・残留は JS 側で判定する。
  // ※ content_ko で絞ると「タイトルに日本語が残るが本文がnull」の記事を取りこぼすため content_ja 基準にする。
  const { data: candidates, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja, content_ja, hashtags_ja, title_ko, summary_ko, content_ko, title_en, summary_en, content_en')
    .not('content_ja', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 対象: ①ko/en のいずれかに日本語の文字が残っている、または ②ko/en の本文・タイトルが欠落している記事。
  const needsFix = (a: NonNullable<typeof candidates>[number]) =>
    !a.title_ko || !a.content_ko || !a.title_en || !a.content_en ||
    hasJpResidue(a.title_ko, a.summary_ko, a.content_ko, a.title_en, a.summary_en, a.content_en);

  const targets = (candidates ?? []).filter(needsFix).slice(0, limit);

  if (targets.length === 0) {
    return NextResponse.json({ updated: 0, message: '対象記事なし（ko/enの欠落・日本語残留は見つからず）' });
  }

  const results = { updated: 0, scanned: candidates?.length ?? 0, errors: [] as string[] };

  for (const article of targets) {
    try {
      const t = await translateArticle(
        article.title_ja,
        article.summary_ja ?? article.title_ja,
        article.content_ja as string,
        article.hashtags_ja ?? [],
        { retryOnResidue: true }, // 訳し漏れ修正が本業の非同期バックストップなので再試行を有効化
      );
      if (!t.content_ko && !t.content_en) {
        results.errors.push(`Empty translation: ${article.id}`);
        continue;
      }
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title_ko: t.title_ko || article.title_ko,
          title_en: t.title_en || article.title_en,
          summary_ko: t.summary_ko || article.summary_ko,
          summary_en: t.summary_en || article.summary_en,
          content_ko: t.content_ko || article.content_ko,
          content_en: t.content_en || article.content_en,
          hashtags_ko: t.hashtags_ko?.length ? t.hashtags_ko : undefined,
          hashtags_en: t.hashtags_en?.length ? t.hashtags_en : undefined,
        })
        .eq('id', article.id);
      if (updateError) results.errors.push(`Update failed: ${article.id} — ${updateError.message}`);
      else results.updated++;
    } catch (e) {
      results.errors.push(`Failed: ${article.id} — ${String(e)}`);
    }
  }

  // ko/en を埋めたらホーム(ISR)を無効化し、翻訳済みタイトルを即反映。
  // collect は ja のみ保存→ここで ko/en が付くため、ko/en ホームの再生成が要る。
  if (results.updated > 0) {
    try {
      for (const l of ['ja', 'ko', 'en']) revalidatePath(`/${l}`);
    } catch (e) {
      results.errors.push(`Revalidate failed: ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
