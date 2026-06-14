import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface SubscribeBody {
  email?: string;
  name?: string;
  company?: string;
  title?: string;
  phone?: string;
  consent?: boolean;
}

export async function POST(req: NextRequest) {
  let body: SubscribeBody = {};
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    /* body無し */
  }
  const email = body.email?.trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: 'consent required' }, { status: 400 });
  }

  const row = {
    email,
    name: body.name?.trim() || null,
    company: body.company?.trim() || null,
    title: body.title?.trim() || null,
    phone: body.phone?.trim() || null,
    consent: true,
  };

  const supabase = getServiceClient();
  let { error } = await supabase.from('subscribers').insert(row);

  // 追加カラム(name等)未追加の環境ではemailのみで再試行（フォームを壊さない）。
  // 42703 = Postgres undefined_column / PGRST204 = PostgRESTのスキーマキャッシュに列なし。
  if (error && (error.code === '42703' || error.code === 'PGRST204')) {
    ({ error } = await supabase.from('subscribers').insert({ email }));
  }

  if (error) {
    // unique violation = already registered
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadyRegistered: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
