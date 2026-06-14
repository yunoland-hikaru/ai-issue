import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');
  const limit = Number(searchParams.get('limit') ?? '20');
  // 検索クエリ。PostgRESTのor()を壊す文字は除去。
  const term = (searchParams.get('q') ?? '').replace(/[,()%*]/g, ' ').trim();

  const supabase = getClient();

  function base() {
    let q = supabase.from('articles').select('*').limit(limit);
    if (category) q = q.eq('category', category);
    if (term) {
      q = q.or(
        `title_ja.ilike.%${term}%,title_ko.ilike.%${term}%,title_en.ilike.%${term}%,` +
        `summary_ja.ilike.%${term}%,summary_ko.ilike.%${term}%,summary_en.ilike.%${term}%`,
      );
    }
    return q;
  }

  // sort=popular: 閲覧数(views)降順 → 同数は新着順。viewsカラム未追加なら新着順にフォールバック。
  if (sort === 'popular') {
    const { data, error } = await base()
      .order('views', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) return NextResponse.json(data ?? []);
    const fb = await base().order('created_at', { ascending: false });
    if (fb.error) return NextResponse.json({ error: fb.error.message }, { status: 500 });
    return NextResponse.json(fb.data ?? []);
  }

  const { data, error } = await base().order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
