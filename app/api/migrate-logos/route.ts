import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { logoUrlForDomain } from '@/lib/logo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 既存記事のロゴURL(DuckDuckGo)を logo.dev に一括移行する。
// 保存済みDDG URL からドメインを抽出して再構築するだけ（Claude再呼び出しなし）。
// LOGODEV_TOKEN が設定されている環境で実行すること。
export async function POST() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('articles')
    .select('id, logo_url')
    .like('logo_url', '%icons.duckduckgo.com%');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ updated: 0, message: '対象なし' });

  const results = { updated: 0, skipped: 0, errors: [] as string[] };

  for (const a of data) {
    const domain = (a.logo_url ?? '').match(/ip3\/([^/]+?)\.ico/)?.[1] ?? null;
    const newUrl = logoUrlForDomain(domain);
    if (!newUrl || newUrl === a.logo_url) {
      results.skipped++;
      continue;
    }
    const { error: upErr } = await supabase.from('articles').update({ logo_url: newUrl }).eq('id', a.id);
    if (upErr) results.errors.push(`${a.id}: ${upErr.message}`);
    else results.updated++;
  }

  return NextResponse.json(results);
}
