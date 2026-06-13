import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { translateArticle } from '@/lib/claude';

export const dynamic = 'force-dynamic';

// 既存記事を後追いで翻訳する補助エンドポイント（収集パイプラインは collect 内で翻訳済み）
export async function POST(req: NextRequest) {
  const { articleId } = await req.json();
  if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 });

  const supabase = getServiceClient();
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja, content_ja')
    .eq('id', articleId)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const translations = await translateArticle(
    article.title_ja,
    article.summary_ja ?? '',
    article.content_ja ?? '',
  );

  await supabase.from('articles').update(translations).eq('id', articleId);

  return NextResponse.json({ ok: true, translations });
}
