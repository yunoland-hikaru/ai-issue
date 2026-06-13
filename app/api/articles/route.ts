import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const limit = Number(searchParams.get('limit') ?? '20');

  const supabase = getClient();
  let query = supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
