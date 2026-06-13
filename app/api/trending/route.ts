import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = getServiceClient();

  // 直近24時間の記事タイトルを取得
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('title_ja, title_en, category')
    .gte('published_at', since);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const count: Record<string, number> = {};

  for (const article of articles ?? []) {
    // カテゴリをキーワードとしてカウント
    if (article.category) {
      count[article.category] = (count[article.category] ?? 0) + 2;
    }
    // タイトルから固有名詞を抽出（英語タイトルの大文字始まり単語）
    const words = (article.title_en ?? '').match(/\b[A-Z][a-zA-Z0-9+\-.]{2,}\b/g) ?? [];
    for (const w of words) {
      if (['The', 'This', 'That', 'With', 'From', 'For', 'New', 'Now'].includes(w)) continue;
      count[w] = (count[w] ?? 0) + 1;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const keywords = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, kCount]) => ({ keyword, count: kCount, date: today }));

  // 今日分を upsert
  await supabase.from('trending_keywords').delete().eq('date', today);
  if (keywords.length > 0) {
    await supabase.from('trending_keywords').insert(keywords);
  }

  return NextResponse.json({ ok: true, keywords });
}

export async function GET() {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('trending_keywords')
    .select('*')
    .eq('date', today)
    .order('count', { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
