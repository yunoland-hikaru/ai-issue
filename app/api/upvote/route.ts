import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { toolId, delta } = await req.json() as { toolId: string; delta: 1 | -1 };
  if (!toolId || ![1, -1].includes(delta)) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: tool } = await supabase
    .from('tools')
    .select('upvotes')
    .eq('id', toolId)
    .single();

  if (!tool) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const next = Math.max(0, tool.upvotes + delta);
  const { error } = await supabase.from('tools').update({ upvotes: next }).eq('id', toolId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ upvotes: next });
}
