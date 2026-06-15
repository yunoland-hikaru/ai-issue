import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { generateHashtags } from '@/lib/claude';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// hashtags_ja が未設定の既存記事に、ハッシュタグ(ja/ko/en)だけを後追い生成・保存する。
// 本文・翻訳等は変更しない。POST /api/migrate-hashtags?limit=1..20
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10', 10), 1), 20);

  const supabase = getServiceClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja')
    .is('hashtags_ja', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length === 0) return NextResponse.json({ updated: 0, message: '対象記事なし（hashtags_ja=null は0件）' });

  const results = { updated: 0, errors: [] as string[] };

  for (const article of articles) {
    try {
      const tags = await generateHashtags(article.title_ja, article.summary_ja ?? article.title_ja);
      if (!tags.ja?.length) {
        results.errors.push(`No hashtags generated: ${article.id}`);
        continue;
      }
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          hashtags_ja: tags.ja,
          hashtags_ko: tags.ko?.length ? tags.ko : null,
          hashtags_en: tags.en?.length ? tags.en : null,
        })
        .eq('id', article.id);
      if (updateError) results.errors.push(`Update failed: ${article.id} — ${updateError.message}`);
      else results.updated++;
    } catch (e) {
      results.errors.push(`Failed: ${article.id} — ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}
