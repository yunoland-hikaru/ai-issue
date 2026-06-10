import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('subscribers').insert({ email });

  if (error) {
    // unique violation = already registered
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadyRegistered: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
