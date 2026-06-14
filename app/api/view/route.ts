import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * 記事の閲覧数(views)を+1する。MOST POPULARランキングの元データ。
 * viewsカラム未追加でも落とさず {ok:false} を返す（読み取りだけ失敗扱い）。
 */
export async function POST(req: NextRequest) {
  let id: string | undefined;
  try {
    ({ id } = (await req.json()) as { id?: string });
  } catch {
    /* body無し */
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = getServiceClient();

  const { data, error } = await supabase.from('articles').select('views').eq('id', id).maybeSingle();
  if (error || !data) return NextResponse.json({ ok: false });

  const next = (data.views ?? 0) + 1;
  const { error: upErr } = await supabase.from('articles').update({ views: next }).eq('id', id);
  if (upErr) return NextResponse.json({ ok: false });

  return NextResponse.json({ ok: true, views: next });
}
